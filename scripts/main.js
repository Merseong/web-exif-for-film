import { handleFiles, removeImage } from "./fileHandler.js";
import { initVersionCheck } from "./version.js";
import {
  COMMON_IFD0_TAGS,
  COMMON_EXIF_TAGS,
  addEntry,
  applyExifToImages,
  clearEntries,
  removeEntry,
  setEntry,
} from "./exifEditor.js";
import { state, on, emit } from "./state.js";
import {
  initUI,
  rerenderAll,
  renderPresetCards,
  renderFilmCards,
  updateApplyStatus,
  updatePresetStatus,
  updateUploadStatus,
  showLoading,
  hideLoading,
  showMergeModal,
  hideMergeModal,
  getMergeSelections,
  getMergeIncoming,
} from "./ui.js";
import { initI18n, setLang, getLang, t } from "./i18n.js";
import {
  addPresetGroup,
  addPresetValue,
  getActivePresetGroup,
  getPresetValue,
  importPresetFile,
  initPresetStore,
  removePresetGroup,
  removePresetValue,
  setActivePresetGroup,
  exportPresetJson,
  renameGroup,
  renameValue,
  reorderGroup,
  reorderValue,
  mergePresets,
  normalizePresets,
  hardClearPresets,
  resetPresetsToDefault,
  getDefaultPresets,
} from "./presets.js";
import {
  initFilmStore,
  addFilm,
  removeFilm,
  renamFilm,
  reorderFilm,
  resetFilmsToDefault,
  hardClearFilms,
  getDefaultFilms,
  getFilmTargetTag,
  getFilmIsoTag,
  setFilmTargetTag,
  exportFilmJson,
  importFilmJson,
  mergeFilms,
} from "./filmPresets.js";

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const entryForm = document.getElementById("entryForm");
  const tagSelect = document.getElementById("tagSelect");
  const tagValue = document.getElementById("tagValue");
  const applyButton = document.getElementById("applyExif");
  const downloadAllButton = document.getElementById("downloadAll");
  const clearEntriesBtn = document.getElementById("clearEntries");
  const dropZone = document.getElementById("dropZone");
  const presetGroupForm = document.getElementById("presetGroupForm");
  const presetGroupName = document.getElementById("presetGroupName");
  const presetGroupTag = document.getElementById("presetGroupTag");
  const presetGroupSelector = document.getElementById("activePresetGroup");
  const presetValueForm = document.getElementById("presetValueForm");
  const presetValueInput = document.getElementById("presetValueInput");
  const exportPresetsBtn = document.getElementById("exportPresets");
  const importPresetsInput = document.getElementById("importPresetsInput");

  const allTags = [
    ...COMMON_IFD0_TAGS.map((tag) => ({ ...tag, ifd: "0th" })),
    ...COMMON_EXIF_TAGS.map((tag) => ({ ...tag, ifd: "Exif" })),
  ];

  function populateTagSelect(selectEl) {
    allTags.forEach((tag, index) => {
      const option = document.createElement("option");
      option.value = tag.key;
      option.textContent = `${tag.label} [${tag.ifd}] (0x${tag.key
        .toString(16)
        .padStart(4, "0")})`;
      option.dataset.label = tag.label;
      option.dataset.ifd = tag.ifd;
      if (index === 0) {
        option.selected = true;
        option.defaultSelected = true;
      }
      selectEl.appendChild(option);
    });
  }

  populateTagSelect(tagSelect);
  populateTagSelect(presetGroupTag);

  initI18n();

  // --- Theme ---
  const THEME_KEY = "exifEditorTheme";
  const themeSelect = document.getElementById("themeSelect");
  const savedTheme = localStorage.getItem(THEME_KEY) || "system";
  document.documentElement.dataset.theme = savedTheme;
  if (themeSelect) {
    themeSelect.value = savedTheme;
    themeSelect.addEventListener("change", () => {
      document.documentElement.dataset.theme = themeSelect.value;
      localStorage.setItem(THEME_KEY, themeSelect.value);
    });
  }

  // --- Language ---
  const langSelect = document.getElementById("langSelect");
  if (langSelect) {
    langSelect.value = getLang();
    langSelect.addEventListener("change", () => {
      setLang(langSelect.value);
      rerenderAll();
    });
  }

  initPresetStore();
  initFilmStore();
  initUI();
  initVersionCheck();

  // --- Preset search ---
  const presetSearchInput = document.getElementById("presetSearch");
  if (presetSearchInput) {
    presetSearchInput.addEventListener("input", () => {
      renderPresetCards(presetSearchInput.value);
    });
  }

  // --- Film search (Step 2) ---
  const filmSearchInput = document.getElementById("filmSearch");
  if (filmSearchInput) {
    filmSearchInput.addEventListener("input", () => {
      renderFilmCards(filmSearchInput.value);
    });
  }

  // --- Film search (Management tab) ---
  const filmMgmtSearchInput = document.getElementById("filmMgmtSearch");
  if (filmMgmtSearchInput) {
    filmMgmtSearchInput.addEventListener("input", () => {
      // Update the filter used by renderFilmList and re-render
      emit("action:filmListFilter", filmMgmtSearchInput.value);
    });
  }

  // --- Film target tag selector ---
  const filmTargetTagEl = document.getElementById("filmTargetTag");
  if (filmTargetTagEl) {
    allTags.forEach((tag) => {
      const option = document.createElement("option");
      option.value = `${tag.ifd}|${tag.key}`;
      option.textContent = `${tag.label} [${tag.ifd}]`;
      option.dataset.label = tag.label;
      option.dataset.ifd = tag.ifd;
      option.dataset.key = tag.key;
      filmTargetTagEl.appendChild(option);
    });
    const current = getFilmTargetTag();
    filmTargetTagEl.value = `${current.ifd}|${current.key}`;

    filmTargetTagEl.addEventListener("change", () => {
      const opt = filmTargetTagEl.options[filmTargetTagEl.selectedIndex];
      setFilmTargetTag(opt.dataset.ifd, opt.dataset.key, opt.dataset.label);
    });
  }

  // --- Film add form ---
  const filmAddForm = document.getElementById("filmAddForm");
  filmAddForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const nameInput = document.getElementById("filmAddName");
      const isoInput = document.getElementById("filmAddIso");
      addFilm(nameInput.value, isoInput.value);
      filmAddForm.reset();
      updatePresetStatus(t("film.added"), "success");
    } catch (error) {
      updatePresetStatus(error.message, "error");
    }
  });

  // --- Action event handlers ---

  on("action:removeImage", (imageId) => removeImage(imageId));

  on("action:removeEntry", (entryId) => removeEntry(entryId));

  on("action:removePresetGroup", (groupId) => {
    removePresetGroup(groupId);
    updatePresetStatus(t("status.groupRemoved"), "warning");
  });

  on("action:applyPresetValue", ({ groupId, valueId }) => {
    const payload = getPresetValue(groupId, valueId);
    if (!payload) {
      updatePresetStatus(t("status.presetNotFound"), "error");
      return;
    }
    const { group, value } = payload;
    setEntry(group.target.ifd, group.target.key, value.value, group.target.label);
    updatePresetStatus(
      t("status.presetApplied", { group: group.name, tag: group.target.label || "tag" }),
      "success"
    );
    updateApplyStatus(
      t("status.presetAppliedHint"),
      "success"
    );
  });

  on("action:removePresetValue", ({ groupId, valueId }) => {
    removePresetValue(groupId, valueId);
    updatePresetStatus(t("status.valueRemoved"), "warning");
  });

  on("action:setActiveGroup", (groupId) => {
    setActivePresetGroup(groupId);
  });

  on("action:renameGroup", ({ groupId, newName }) => renameGroup(groupId, newName));
  on("action:renameValue", ({ groupId, valueId, newLabel }) => renameValue(groupId, valueId, newLabel));
  on("action:reorderGroup", ({ groupId, direction }) => reorderGroup(groupId, direction));
  on("action:reorderValue", ({ groupId, valueId, direction }) => reorderValue(groupId, valueId, direction));

  // --- Film action handlers ---

  on("action:applyFilm", ({ name, iso, targetTag, isoTag }) => {
    setEntry(targetTag.ifd, targetTag.key, name, targetTag.label);
    setEntry(isoTag.ifd, isoTag.key, iso, "ISOSpeedRatings");
    updateApplyStatus(t("film.applied", { name, iso }), "success");
  });

  on("action:applyFilmIso", ({ iso, isoTag }) => {
    setEntry(isoTag.ifd, isoTag.key, iso, "ISOSpeedRatings");
    updateApplyStatus(t("film.isoUpdated", { iso }), "success");
  });

  on("action:removeFilm", (filmId) => {
    removeFilm(filmId);
    updatePresetStatus(t("film.removed"), "warning");
  });

  on("action:renameFilm", ({ filmId, newName, newIso }) => {
    renamFilm(filmId, newName, newIso);
  });

  on("action:reorderFilm", ({ filmId, direction }) => {
    reorderFilm(filmId, direction);
  });

  document.getElementById("resetFilms")?.addEventListener("click", () => {
    if (!confirm(t("confirm.resetDefault"))) return;
    resetFilmsToDefault();
    updatePresetStatus(t("film.resetDone"), "success");
  });

  // --- Tab & step navigation ---

  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeTab = btn.dataset.tab;
      emit("tab");
    });
  });

  document.getElementById("clearImages")?.addEventListener("click", () => {
    state.images = [];
    emit("images");
    updateUploadStatus(t("status.imageCleared"), "warning");
  });

  document.getElementById("step1Next")?.addEventListener("click", () => {
    if (state.images.length > 0) { state.currentStep = 2; emit("step"); }
  });
  document.getElementById("step2Prev")?.addEventListener("click", () => {
    state.currentStep = 1; emit("step");
  });
  document.getElementById("step2Next")?.addEventListener("click", () => {
    if (state.entries.length > 0) { state.currentStep = 3; emit("step"); }
  });
  document.getElementById("step3Prev")?.addEventListener("click", () => {
    state.currentStep = 2; emit("step");
  });

  on("action:goToStep", (step) => {
    state.currentStep = step;
    emit("step");
  });

  // --- DOM event listeners ---

  async function loadFiles(fileList) {
    showLoading(t("status.loadingImages"));
    try {
      const result = await handleFiles(fileList);
      updateUploadStatus(result.message, result.tone);
    } finally {
      hideLoading();
    }
  }

  fileInput.addEventListener("change", (event) => {
    loadFiles(event.target.files);
    fileInput.value = "";
  });

  if (dropZone) {
    let dragDepth = 0;
    const clearHighlight = () => dropZone.classList.remove("dropzone--hover");

    dropZone.addEventListener("click", () => {
      fileInput.click();
    });

    document.addEventListener("dragenter", (event) => {
      event.preventDefault();
      dragDepth += 1;
      dropZone.classList.add("dropzone--hover");
    });

    document.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    ["dragleave"].forEach((evt) => {
      document.addEventListener(evt, (event) => {
        event.preventDefault();
        dragDepth = Math.max(0, dragDepth - 1);
        if (dragDepth === 0) clearHighlight();
      });
    });

    document.addEventListener("drop", (event) => {
      event.preventDefault();
      clearHighlight();
      dragDepth = 0;
      const files = event.dataTransfer?.files;
      if (files && files.length) {
        loadFiles(files);
      }
    });
  }

  entryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const selectedTag = tagSelect.options[tagSelect.selectedIndex];
      addEntry(
        selectedTag.dataset.ifd,
        selectedTag.value,
        tagValue.value,
        selectedTag.dataset.label
      );
      entryForm.reset();
      updateApplyStatus(
        t("status.entryAdded"),
        ""
      );
    } catch (error) {
      updateUploadStatus(error.message, "error");
    }
  });

  clearEntriesBtn?.addEventListener("click", () => {
    clearEntries();
    updateApplyStatus(t("status.entriesCleared"), "warning");
  });

  applyButton.addEventListener("click", () => {
    showLoading(t("status.applyingExif"));
    try {
      const result = applyExifToImages();
      const tone = result.success ? "success" : "error";
      updateApplyStatus(result.message, tone);
    } finally {
      hideLoading();
    }
  });

  downloadAllButton.addEventListener("click", async () => {
    if (state.images.length === 0) {
      updateApplyStatus(t("status.noDownload"), "warning");
      return;
    }

    if (state.images.length === 1) {
      const image = state.images[0];
      const link = document.createElement("a");
      link.href = image.dataUrl;
      link.download = `exif-${image.name}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      updateApplyStatus(t("status.downloadStarted"), "success");
      return;
    }

    if (typeof JSZip === "undefined") {
      updateApplyStatus(t("status.zipLoading"), "error");
      return;
    }

    showLoading(t("status.zipCreating"));
    try {
      const zip = new JSZip();
      state.images.forEach((image) => {
        const base64 = image.dataUrl.split(",")[1];
        zip.file(`exif-${image.name}`, base64, { base64: true });
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `exif-images-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      updateApplyStatus(
        t("status.zipDownload", { count: state.images.length }),
        "success"
      );
    } catch (error) {
      updateApplyStatus(t("status.zipFailed", { error: error.message }), "error");
    } finally {
      hideLoading();
    }
  });

  presetGroupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const selectedTag = presetGroupTag.options[presetGroupTag.selectedIndex];
      addPresetGroup({
        name: presetGroupName.value,
        ifd: selectedTag.dataset.ifd,
        key: selectedTag.value,
        label: selectedTag.dataset.label,
      });
      presetGroupForm.reset();
      updatePresetStatus(t("status.groupAdded"), "success");
    } catch (error) {
      updatePresetStatus(error.message, "error");
    }
  });

  presetGroupSelector.addEventListener("change", (event) => {
    setActivePresetGroup(event.target.value);
  });

  presetValueForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const activeGroup = getActivePresetGroup();
    if (!activeGroup) {
      updatePresetStatus(t("status.createGroupFirst"), "warning");
      return;
    }
    try {
      addPresetValue(activeGroup.id, presetValueInput.value);
      presetValueForm.reset();
      updatePresetStatus(t("status.valueAdded"), "success");
    } catch (error) {
      updatePresetStatus(error.message, "error");
    }
  });

  document.getElementById("hardClearPresets")?.addEventListener("click", () => {
    if (!confirm(t("confirm.hardClear"))) return;
    hardClearPresets();
    hardClearFilms();
    updatePresetStatus(t("status.hardCleared"), "warning");
  });

  document.getElementById("resetPresets")?.addEventListener("click", () => {
    if (!confirm(t("confirm.resetDefault"))) return;
    resetPresetsToDefault();
    resetFilmsToDefault();
    updatePresetStatus(t("status.resetDone"), "success");
  });

  document.getElementById("mergeDefaultPresets")?.addEventListener("click", () => {
    const defaults = getDefaultPresets();
    showMergeModal(defaults);
  });

  exportPresetsBtn.addEventListener("click", () => {
    const combined = {
      presets: JSON.parse(exportPresetJson()),
      filmPresets: JSON.parse(exportFilmJson()),
    };
    const json = JSON.stringify(combined, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `exif-presets-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    updatePresetStatus(t("status.exported"), "success");
  });

  importPresetsInput.addEventListener("change", async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      // Support both combined format and legacy presets-only format
      if (parsed.presets) {
        importPresetJson(JSON.stringify(parsed.presets));
      } else {
        importPresetJson(text);
      }
      if (parsed.filmPresets) {
        importFilmJson(JSON.stringify(parsed.filmPresets));
      }
      updatePresetStatus(t("status.imported", { file: file.name }), "success");
    } catch (error) {
      updatePresetStatus(t("status.importFailed", { error: error.message }), "error");
    } finally {
      importPresetsInput.value = "";
    }
  });

  // --- Merge Presets ---

  const mergePresetsInput = document.getElementById("mergePresetsInput");

  let pendingFilmMerge = null; // filmPresets data from merge JSON

  mergePresetsInput?.addEventListener("change", async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      // Support combined format or legacy presets-only
      const presetData = parsed.presets || parsed;
      const normalized = normalizePresets(presetData);
      pendingFilmMerge = parsed.filmPresets || null;
      showMergeModal(normalized);
    } catch (error) {
      updatePresetStatus(t("status.mergeFailed", { error: error.message }), "error");
    } finally {
      mergePresetsInput.value = "";
    }
  });

  document.getElementById("mergeConfirm")?.addEventListener("click", () => {
    const incoming = getMergeIncoming();
    const selections = getMergeSelections();
    if (!incoming || selections.length === 0) {
      // Even if no preset groups selected, merge films if present
      if (pendingFilmMerge) {
        mergeFilms(pendingFilmMerge);
        pendingFilmMerge = null;
        hideMergeModal();
        updatePresetStatus(t("status.merged"), "success");
      }
      return;
    }
    mergePresets(incoming, selections);
    if (pendingFilmMerge) {
      mergeFilms(pendingFilmMerge);
      pendingFilmMerge = null;
    }
    hideMergeModal();
    updatePresetStatus(t("status.merged"), "success");
  });

  document.getElementById("mergeCancel")?.addEventListener("click", hideMergeModal);
  document.getElementById("mergeClose")?.addEventListener("click", hideMergeModal);

  const mergeOverlay = document.getElementById("mergeOverlay");
  mergeOverlay?.addEventListener("click", (e) => {
    if (e.target === mergeOverlay) hideMergeModal();
  });
});
