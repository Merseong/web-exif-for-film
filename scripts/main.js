import { handleFiles, removeImage } from "./fileHandler.js";
import {
  COMMON_IFD0_TAGS,
  COMMON_EXIF_TAGS,
  addEntry,
  applyExifToImages,
  clearEntries,
  removeEntry,
  setEntry,
} from "./exifEditor.js";
import {
  registerRemoveHandlers,
  registerPresetHandlers,
  renderEntries,
  renderImages,
  renderPresetGroups,
  renderPresetValues,
  updateApplyStatus,
  updatePresetStatus,
  updateUploadStatus,
} from "./ui.js";
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
} from "./presets.js";

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const entryForm = document.getElementById("entryForm");
  const tagSelect = document.getElementById("tagSelect");
  const tagValue = document.getElementById("tagValue");
  const applyButton = document.getElementById("applyExif");
  const clearEntriesBtn = document.getElementById("clearEntries");
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

  initPresetStore();

  registerRemoveHandlers({
    image: removeImage,
    entry: (entryId) => {
      removeEntry(entryId);
      renderEntries();
    },
  });

  fileInput.addEventListener("change", (event) => {
    handleFiles(event.target.files);
    fileInput.value = "";
  });

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
      renderEntries();
      entryForm.reset();
      updateApplyStatus(
        "EXIF entry added. Click Apply EXIF to write it to your images.",
        ""
      );
    } catch (error) {
      updateUploadStatus(error.message, "error");
    }
  });

  clearEntriesBtn.addEventListener("click", () => {
    clearEntries();
    renderEntries();
    updateApplyStatus("All EXIF entries cleared.", "warning");
  });

  applyButton.addEventListener("click", () => {
    const result = applyExifToImages();
    renderImages();
    const tone = result.success ? "success" : "error";
    updateApplyStatus(result.message, tone);
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
      renderPresetGroups();
      renderPresetValues();
      updatePresetStatus("Group added.", "success");
    } catch (error) {
      updatePresetStatus(error.message, "error");
    }
  });

  presetGroupSelector.addEventListener("change", (event) => {
    setActivePresetGroup(event.target.value);
    renderPresetGroups();
    renderPresetValues();
  });

  presetValueForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const activeGroup = getActivePresetGroup();
    if (!activeGroup) {
      updatePresetStatus("Create a group before adding values.", "warning");
      return;
    }
    try {
      addPresetValue(activeGroup.id, presetValueInput.value);
      presetValueForm.reset();
      renderPresetValues();
      renderPresetGroups();
      updatePresetStatus("Value added to the group.", "success");
    } catch (error) {
      updatePresetStatus(error.message, "error");
    }
  });

  exportPresetsBtn.addEventListener("click", () => {
    const json = exportPresetJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `exif-presets-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    updatePresetStatus("Preset JSON exported.", "success");
  });

  importPresetsInput.addEventListener("change", async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    try {
      await importPresetFile(file);
      renderPresetGroups();
      renderPresetValues();
      updatePresetStatus(`Imported presets from ${file.name}.`, "success");
    } catch (error) {
      updatePresetStatus(`Import failed: ${error.message}`, "error");
    } finally {
      importPresetsInput.value = "";
    }
  });

  registerPresetHandlers({
    removeGroup: (groupId) => {
      removePresetGroup(groupId);
      renderPresetGroups();
      renderPresetValues();
      updatePresetStatus("Group removed.", "warning");
    },
    applyValue: (groupId, valueId) => {
      const payload = getPresetValue(groupId, valueId);
      if (!payload) {
        updatePresetStatus("Could not find that preset value.", "error");
        return;
      }
      const { group, value } = payload;
      setEntry(group.target.ifd, group.target.key, value.value, group.target.label);
      renderEntries();
      updatePresetStatus(
        `Applied ${group.name} preset to ${group.target.label || "tag"}.`,
        "success"
      );
      updateApplyStatus(
        "Preset applied. Click Apply EXIF to write it to your images.",
        "success"
      );
    },
    removeValue: (groupId, valueId) => {
      removePresetValue(groupId, valueId);
      renderPresetValues();
      updatePresetStatus("Value removed from the group.", "warning");
    },
  });

  // Initial render
  renderPresetGroups();
  renderPresetValues();
  renderEntries();
  renderImages();
});
