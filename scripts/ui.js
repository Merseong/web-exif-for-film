import { state, on, emit } from "./state.js";
import { TAG_LABELS } from "./exifEditor.js";
import { t } from "./i18n.js";

const uploadStatusEl = document.getElementById("uploadStatus");
const applyStatusEl = document.getElementById("applyStatus");
const imageListEl = document.getElementById("imageList");
const entryItemsEl = document.getElementById("entryItems");
const presetGroupListEl = document.getElementById("presetGroupList");
const presetValueListEl = document.getElementById("presetValueList");
const presetGroupSelectEl = document.getElementById("activePresetGroup");
const presetStatusEl = document.getElementById("presetStatus");
const loadingOverlayEl = document.getElementById("loadingOverlay");
const loadingTextEl = document.getElementById("loadingText");
const detailOverlayEl = document.getElementById("imageDetailOverlay");
const detailImageEl = document.getElementById("imageDetailImg");
const detailTitleEl = document.getElementById("imageDetailTitle");
const detailMetaEl = document.getElementById("imageDetailMeta");
const detailListEl = document.getElementById("imageDetailList");
const detailCloseEl = document.getElementById("imageDetailClose");

const filmCardsEl = document.getElementById("filmCards");
const filmIsoRowEl = document.getElementById("filmIsoRow");
const filmIsoLabelEl = document.getElementById("filmIsoLabel");
const filmIsoInputEl = document.getElementById("filmIsoInput");
const filmListEl = document.getElementById("filmList");

const mergeOverlayEl = document.getElementById("mergeOverlay");
const mergeContentEl = document.getElementById("mergeContent");
const mergeSummaryEl = document.getElementById("mergeSummary");

let mergeState = null; // { incoming, selections: Map<groupId, Set<valueId>> }
let selectedFilm = null; // { id, name, iso }

const tabButtons = document.querySelectorAll(".tab");
const tabApplyEl = document.getElementById("tabApply");
const tabPresetsEl = document.getElementById("tabPresets");
const stepperEl = document.getElementById("stepper");
const stepEls = [
  document.getElementById("step1"),
  document.getElementById("step2"),
  document.getElementById("step3"),
];
const step1NextBtn = document.getElementById("step1Next");
const step2PrevBtn = document.getElementById("step2Prev");
const step2NextBtn = document.getElementById("step2Next");
const step3PrevBtn = document.getElementById("step3Prev");

function getStepLabels() {
  return [t("step.upload"), t("step.exif"), t("step.apply")];
}

function setStatus(el, message, tone) {
  el.className = "status";
  el.textContent = message || "";
  if (!message) return;

  const classMap = {
    success: "status--success",
    error: "status--error",
    warning: "status--warning",
  };
  if (tone && classMap[tone]) {
    el.classList.add(classMap[tone]);
  }
  el.textContent = message;
}

export function updateUploadStatus(message, tone) {
  setStatus(uploadStatusEl, message, tone);
}

export function updateApplyStatus(message, tone) {
  setStatus(applyStatusEl, message, tone);
}

export function updatePresetStatus(message, tone) {
  setStatus(presetStatusEl, message, tone);
}

export function showLoading(message = "Working...") {
  if (!loadingOverlayEl) return;
  loadingOverlayEl.classList.add("loading-overlay--visible");
  if (loadingTextEl) {
    loadingTextEl.textContent = message;
  }
}

export function hideLoading() {
  if (!loadingOverlayEl) return;
  loadingOverlayEl.classList.remove("loading-overlay--visible");
}

function normalizeValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object" && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function extractExifEntries(image) {
  if (typeof piexif === "undefined") return [];
  try {
    const data = piexif.load(image.dataUrl);
    const ifds = ["0th", "Exif", "GPS"];
    const entries = [];
    ifds.forEach((ifd) => {
      const section = data[ifd];
      if (!section) return;
      Object.keys(section).forEach((keyStr) => {
        const key = Number.parseInt(keyStr, 10);
        const label = TAG_LABELS[`${ifd}-${key}`] || `0x${key.toString(16)}`;
        entries.push({
          ifd,
          key,
          label,
          value: normalizeValue(section[keyStr]),
        });
      });
    });
    return entries;
  } catch (error) {
    console.warn("Failed to parse EXIF for image", error);
    return [];
  }
}

function hideDetail() {
  if (!detailOverlayEl) return;
  detailOverlayEl.classList.remove("image-detail--visible");
}

export function showImageDetail(image) {
  if (!detailOverlayEl) return;
  detailOverlayEl.classList.add("image-detail--visible");
  if (detailImageEl) {
    detailImageEl.src = image.dataUrl;
    detailImageEl.alt = image.name;
  }
  if (detailTitleEl) {
    detailTitleEl.textContent = image.name;
  }
  if (detailMetaEl) {
    detailMetaEl.textContent = image.size;
  }

  if (detailListEl) {
    detailListEl.innerHTML = "";
    const entries = extractExifEntries(image);
    if (entries.length === 0) {
      const empty = document.createElement("li");
      empty.className = "muted";
      empty.textContent = t("empty.noExif");
      detailListEl.appendChild(empty);
    } else {
      entries.forEach((entry) => {
        const item = document.createElement("li");
        item.className = "detail-entry";

        const label = document.createElement("span");
        label.className = "detail-entry__label";
        label.textContent = entry.label;

        const value = document.createElement("span");
        value.className = "detail-entry__value";
        value.textContent = entry.value;

        item.appendChild(label);
        item.appendChild(value);
        detailListEl.appendChild(item);
      });
    }
  }
}

if (detailOverlayEl) {
  detailOverlayEl.addEventListener("click", (event) => {
    if (event.target === detailOverlayEl) {
      hideDetail();
    }
  });
}

if (detailCloseEl) {
  detailCloseEl.addEventListener("click", hideDetail);
}

document.getElementById("filmIsoApply")?.addEventListener("click", () => {
  if (!selectedFilm) return;
  const iso = Number(filmIsoInputEl?.value);
  const resolvedIso = Number.isFinite(iso) ? iso : selectedFilm.iso;
  const isoTag = { ifd: "Exif", key: 0x8827 };

  // Only re-apply ISO (film name was already applied on card click)
  emit("action:applyFilmIso", { iso: resolvedIso, isoTag });
  updateFilmPreview(selectedFilm.name, resolvedIso);
});

export function renderThumbnails() {
  const thumbnailGrid = document.getElementById("thumbnailGrid");
  if (!thumbnailGrid) return;

  thumbnailGrid.innerHTML = "";

  state.images.forEach((image) => {
    const wrapper = document.createElement("div");
    wrapper.className = "thumbnail";

    const img = document.createElement("img");
    img.className = "thumbnail__img";
    img.src = image.dataUrl;
    img.alt = image.name;

    const name = document.createElement("span");
    name.className = "thumbnail__name";
    name.textContent = image.name;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "thumbnail__remove";
    removeBtn.textContent = "\u00d7";
    removeBtn.addEventListener("click", () => {
      emit("action:removeImage", image.id);
    });

    wrapper.appendChild(img);
    wrapper.appendChild(name);
    wrapper.appendChild(removeBtn);
    thumbnailGrid.appendChild(wrapper);
  });
}

export function renderPresetCards(filter = "") {
  const presetCardGroups = document.getElementById("presetCardGroups");
  if (!presetCardGroups) return;

  presetCardGroups.innerHTML = "";
  const lowerFilter = filter.toLowerCase();

  state.presets.groups.forEach((group) => {
    const section = document.createElement("div");
    section.className = "preset-card-group";

    const label = document.createElement("div");
    label.className = "preset-card-group__label";

    const matchingValues = lowerFilter
      ? group.values.filter((v) => v.label.toLowerCase().includes(lowerFilter))
      : group.values;

    if (lowerFilter && matchingValues.length === 0) {
      section.classList.add("preset-card-group--dim");
      label.textContent = `${group.name} — ${t("empty.noMatch")}`;
      section.appendChild(label);
      presetCardGroups.appendChild(section);
      return;
    }

    if (lowerFilter && matchingValues.length < group.values.length) {
      label.textContent = `${group.name} — ${t("count.filtered", { total: group.values.length, match: matchingValues.length })}`;
    } else {
      label.textContent = group.name;
    }

    section.appendChild(label);

    const cardsWrapper = document.createElement("div");
    cardsWrapper.className = "preset-card-group__cards";

    matchingValues.forEach((value) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "preset-card";
      btn.textContent = value.label;

      // Check if this preset value is currently selected in entries
      const isSelected = state.entries.some(
        (entry) =>
          entry.ifd === group.target.ifd &&
          entry.key === group.target.key &&
          entry.original === value.value
      );
      if (isSelected) {
        btn.classList.add("preset-card--selected");
      }

      btn.addEventListener("click", () => {
        emit("action:applyPresetValue", { groupId: group.id, valueId: value.id });
      });

      cardsWrapper.appendChild(btn);
    });

    section.appendChild(cardsWrapper);
    presetCardGroups.appendChild(section);
  });
}

function updateFilmPreview(name, iso) {
  if (filmIsoLabelEl) {
    filmIsoLabelEl.textContent = t("film.selected", { name });
  }
  const previewEl = document.getElementById("filmPreviewTags");
  if (previewEl) {
    const targetTag = state.filmPresets.targetTag;
    previewEl.innerHTML = "";

    const nameTag = document.createElement("span");
    nameTag.className = "film-preview-tag";
    nameTag.innerHTML = `<strong>${targetTag.label || "Model"}</strong> = ${name}`;
    previewEl.appendChild(nameTag);

    const isoTag = document.createElement("span");
    isoTag.className = "film-preview-tag";
    isoTag.innerHTML = `<strong>ISOSpeedRatings</strong> = ${iso}`;
    previewEl.appendChild(isoTag);
  }
}

export function renderFilmCards(filter = "") {
  if (!filmCardsEl) return;
  filmCardsEl.innerHTML = "";

  const films = state.filmPresets.films;
  if (!films || films.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = t("film.empty");
    filmCardsEl.appendChild(empty);
    return;
  }

  const query = filter.toLowerCase().trim();
  const filtered = query
    ? films.filter((f) => f.name.toLowerCase().includes(query) || String(f.iso).includes(query))
    : films;

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = t("empty.noMatch");
    filmCardsEl.appendChild(empty);
    return;
  }

  filtered.forEach((film) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "preset-card";

    if (selectedFilm && selectedFilm.id === film.id) {
      btn.classList.add("preset-card--selected");
    }

    const nameText = document.createTextNode(film.name + " ");
    btn.appendChild(nameText);

    const isoSpan = document.createElement("span");
    isoSpan.className = "film-item__iso";
    isoSpan.textContent = `ISO ${film.iso}`;
    btn.appendChild(isoSpan);

    btn.addEventListener("click", () => {
      selectedFilm = { id: film.id, name: film.name, iso: film.iso };
      // Immediately apply film name + default ISO
      const targetTag = state.filmPresets.targetTag;
      const isoTag = { ifd: "Exif", key: 0x8827 };
      emit("action:applyFilm", {
        name: film.name,
        iso: film.iso,
        targetTag,
        isoTag,
      });
      // Show ISO edit row
      if (filmIsoRowEl) {
        filmIsoRowEl.classList.remove("film-iso-row--hidden");
      }
      if (filmIsoInputEl) {
        filmIsoInputEl.value = film.iso;
      }
      updateFilmPreview(film.name, film.iso);
      renderFilmCards(filter);
    });

    filmCardsEl.appendChild(btn);
  });
}

const FILMS_PER_PAGE = 10;
let filmListPage = 1;
let filmListFilter = "";

export function renderFilmList() {
  if (!filmListEl) return;
  filmListEl.innerHTML = "";

  const films = state.filmPresets.films;
  if (!films || films.length === 0) {
    const empty = document.createElement("li");
    empty.className = "muted";
    empty.textContent = t("film.empty");
    filmListEl.appendChild(empty);
    renderFilmPagination(0);
    return;
  }

  const query = filmListFilter.toLowerCase().trim();
  const filtered = query
    ? films.filter((f) => f.name.toLowerCase().includes(query) || String(f.iso).includes(query))
    : films;

  const totalPages = Math.max(1, Math.ceil(filtered.length / FILMS_PER_PAGE));
  if (filmListPage > totalPages) filmListPage = totalPages;
  const start = (filmListPage - 1) * FILMS_PER_PAGE;
  const paged = filtered.slice(start, start + FILMS_PER_PAGE);

  if (paged.length === 0) {
    const empty = document.createElement("li");
    empty.className = "muted";
    empty.textContent = t("empty.noMatch");
    filmListEl.appendChild(empty);
    renderFilmPagination(0);
    return;
  }

  paged.forEach((film) => {
    const item = document.createElement("li");
    item.className = "preset-value";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = film.name;

    const isoSpan = document.createElement("span");
    isoSpan.className = "film-item__iso";
    isoSpan.textContent = `ISO ${film.iso}`;

    const actions = document.createElement("div");
    actions.className = "preset-value__actions";

    const upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "preset-item__btn";
    upBtn.textContent = "\u2191";
    upBtn.addEventListener("click", () =>
      emit("action:reorderFilm", { filmId: film.id, direction: -1 })
    );

    const downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.className = "preset-item__btn";
    downBtn.textContent = "\u2193";
    downBtn.addEventListener("click", () =>
      emit("action:reorderFilm", { filmId: film.id, direction: 1 })
    );

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "preset-item__btn";
    editBtn.textContent = t("action.edit");
    editBtn.addEventListener("click", () => {
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.className = "preset-item__edit-input";
      nameInput.value = film.name;
      nameSpan.replaceWith(nameInput);

      const isoInput = document.createElement("input");
      isoInput.type = "number";
      isoInput.className = "preset-item__edit-input";
      isoInput.value = film.iso;
      isoInput.style.width = "80px";
      isoSpan.replaceWith(isoInput);

      nameInput.focus();

      const commitRename = () => {
        emit("action:renameFilm", {
          filmId: film.id,
          newName: nameInput.value,
          newIso: isoInput.value,
        });
      };

      nameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          nameInput.removeEventListener("blur", commitRename);
          isoInput.removeEventListener("blur", commitRename);
          commitRename();
        }
      });
      isoInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          nameInput.removeEventListener("blur", commitRename);
          isoInput.removeEventListener("blur", commitRename);
          commitRename();
        }
      });
      nameInput.addEventListener("blur", () => {
        // Delay to allow isoInput to receive focus without triggering commit
        setTimeout(() => {
          if (document.activeElement !== isoInput) {
            commitRename();
          }
        }, 100);
      });
      isoInput.addEventListener("blur", () => {
        setTimeout(() => {
          if (document.activeElement !== nameInput) {
            commitRename();
          }
        }, 100);
      });
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "preset-item__btn preset-item__btn--danger";
    removeBtn.textContent = t("action.remove");
    removeBtn.addEventListener("click", () => emit("action:removeFilm", film.id));

    actions.appendChild(upBtn);
    actions.appendChild(downBtn);
    actions.appendChild(editBtn);
    actions.appendChild(removeBtn);

    item.appendChild(nameSpan);
    item.appendChild(isoSpan);
    item.appendChild(actions);
    filmListEl.appendChild(item);
  });

  renderFilmPagination(totalPages);
}

function renderFilmPagination(totalPages) {
  const container = document.getElementById("filmPagination");
  if (!container) return;
  container.innerHTML = "";
  if (totalPages <= 1) return;

  const prev = document.createElement("button");
  prev.type = "button";
  prev.className = "pagination__btn";
  prev.textContent = "←";
  prev.disabled = filmListPage <= 1;
  prev.addEventListener("click", () => { filmListPage--; renderFilmList(); });

  const info = document.createElement("span");
  info.className = "pagination__info";
  info.textContent = t("film.pageInfo", { current: filmListPage, total: totalPages });

  const next = document.createElement("button");
  next.type = "button";
  next.className = "pagination__btn";
  next.textContent = "→";
  next.disabled = filmListPage >= totalPages;
  next.addEventListener("click", () => { filmListPage++; renderFilmList(); });

  container.appendChild(prev);
  container.appendChild(info);
  container.appendChild(next);
}

export function renderEntryChips() {
  const entryChips = document.getElementById("entryChips");
  if (!entryChips) return;

  entryChips.innerHTML = "";

  if (state.entries.length === 0) {
    const empty = document.createElement("span");
    empty.className = "muted";
    empty.textContent = t("empty.noEntries");
    entryChips.appendChild(empty);
    return;
  }

  const label = document.createElement("span");
  label.className = "muted";
  label.textContent = t("count.entriesLabel", { count: state.entries.length });
  entryChips.appendChild(label);

  state.entries.forEach((entry) => {
    const chip = document.createElement("span");
    chip.className = "entry-chip";

    const tagLabel = entry.label || entry.keyHex || entry.key;
    chip.innerHTML = `<strong>${tagLabel}</strong> = ${entry.original}`;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "entry-chip__remove";
    removeBtn.textContent = "\u00d7";
    removeBtn.addEventListener("click", () => {
      emit("action:removeEntry", entry.id);
    });

    chip.appendChild(removeBtn);
    entryChips.appendChild(chip);
  });
}

export function renderApplySummary() {
  const applySummary = document.getElementById("applySummary");
  const applyEntryList = document.getElementById("applyEntryList");

  if (applySummary) {
    applySummary.innerHTML = "";

    const imageCard = document.createElement("div");
    imageCard.className = "apply-summary__card";
    const imageLabel = document.createElement("p");
    imageLabel.className = "apply-summary__label";
    imageLabel.textContent = t("summary.images");
    const imageValue = document.createElement("p");
    imageValue.className = "apply-summary__value";
    imageValue.textContent = state.images.length + t("unit.images");
    imageCard.appendChild(imageLabel);
    imageCard.appendChild(imageValue);

    const entryCard = document.createElement("div");
    entryCard.className = "apply-summary__card";
    const entryLabel = document.createElement("p");
    entryLabel.className = "apply-summary__label";
    entryLabel.textContent = t("summary.entries");
    const entryValue = document.createElement("p");
    entryValue.className = "apply-summary__value";
    entryValue.textContent = state.entries.length + t("unit.entries");
    entryCard.appendChild(entryLabel);
    entryCard.appendChild(entryValue);

    applySummary.appendChild(imageCard);
    applySummary.appendChild(entryCard);
  }

  if (applyEntryList) {
    applyEntryList.innerHTML = "";

    state.entries.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "apply-entry-row";

      const left = document.createElement("span");
      const tagName = entry.label || entry.keyHex || entry.key;
      left.textContent = `${tagName} [${entry.ifd}]`;

      const right = document.createElement("span");
      right.className = "muted";
      right.textContent = entry.original;

      row.appendChild(left);
      row.appendChild(right);
      applyEntryList.appendChild(row);
    });
  }
}

export function renderEntries() {
  if (!entryItemsEl) return;
  entryItemsEl.innerHTML = "";
  if (state.entries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "muted";
    empty.textContent = t("empty.noEntriesYet");
    entryItemsEl.appendChild(empty);
    return;
  }

  state.entries.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "entry-item";

    const text = document.createElement("div");
    text.className = "entry-item__text";

    const displayKey = entry.label || entry.keyHex || entry.key;
    text.innerHTML = `<span><strong>${displayKey}</strong> = ${entry.original}</span>`;

    const ifd = document.createElement("span");
    ifd.className = "entry-item__ifd";
    ifd.textContent = entry.ifd;
    text.appendChild(ifd);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "button button--ghost";
    removeBtn.textContent = t("action.remove");
    removeBtn.addEventListener("click", () => {
      emit("action:removeEntry", entry.id);
    });

    item.appendChild(text);
    item.appendChild(removeBtn);
    entryItemsEl.appendChild(item);
  });
}

export function renderImages() {
  imageListEl.innerHTML = "";
  if (state.images.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = t("empty.noImages");
    imageListEl.appendChild(empty);
    return;
  }

  state.images.forEach((image) => {
    const card = document.createElement("article");
    card.className = "image-card";

    const img = document.createElement("img");
    img.className = "image-card__preview";
    img.src = image.dataUrl;
    img.alt = image.name;

    const body = document.createElement("div");
    body.className = "image-card__body";

    const title = document.createElement("p");
    title.className = "image-card__title";
    title.textContent = image.name;

    const meta = document.createElement("p");
    meta.className = "image-card__meta";
    meta.textContent = image.size;

    const actions = document.createElement("div");
    actions.className = "image-card__actions";

    const download = document.createElement("a");
    download.href = image.dataUrl;
    download.download = `exif-${image.name}`;
    download.className = "button button--secondary";
    download.textContent = t("action.download");

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "button button--ghost";
    remove.textContent = t("action.removeFromList");
    remove.addEventListener("click", () => emit("action:removeImage", image.id));

    actions.appendChild(remove);
    actions.appendChild(download);

    body.appendChild(title);
    body.appendChild(meta);
    body.appendChild(actions);

    card.addEventListener("click", (event) => {
      // Avoid triggering on button clicks
      if (event.target.closest("button") || event.target.closest("a")) return;
      showImageDetail(image);
    });

    card.appendChild(img);
    card.appendChild(body);

    imageListEl.appendChild(card);
  });
}

export function renderPresetGroups() {
  if (!presetGroupListEl || !presetGroupSelectEl) return;

  presetGroupListEl.innerHTML = "";
  presetGroupSelectEl.innerHTML = "";

  if (!state.presets.groups.length) {
    const empty = document.createElement("li");
    empty.className = "muted";
    empty.textContent = t("empty.noGroups");
    presetGroupListEl.appendChild(empty);

    const placeholder = document.createElement("option");
    placeholder.textContent = t("empty.noGroupsOption");
    placeholder.value = "";
    presetGroupSelectEl.appendChild(placeholder);
    presetGroupSelectEl.disabled = true;
    return;
  }

  presetGroupSelectEl.disabled = false;

  state.presets.groups.forEach((group) => {
    const option = document.createElement("option");
    option.value = group.id;
    option.textContent = group.name;
    if (group.id === state.presets.activeGroupId) {
      option.selected = true;
    }
    presetGroupSelectEl.appendChild(option);

    const item = document.createElement("li");
    item.className = "preset-item";
    if (group.id === state.presets.activeGroupId) {
      item.classList.add("preset-item--active");
    }

    // Click-to-select: clicking the item (not on a button/input) sets it active
    item.addEventListener("click", (event) => {
      if (event.target.closest("button") || event.target.closest("input")) return;
      emit("action:setActiveGroup", group.id);
    });
    item.style.cursor = "pointer";

    const text = document.createElement("div");
    text.className = "preset-item__text";

    const name = document.createElement("strong");
    name.textContent = group.name;

    const meta = document.createElement("p");
    meta.className = "preset-item__meta";
    meta.textContent = `${group.target.label || "Tag"} \u2022 ${
      group.target.ifd
    } \u2022 0x${group.target.key.toString(16).padStart(4, "0")}`;

    text.appendChild(name);
    text.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "preset-item__actions";

    const upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "preset-item__btn";
    upBtn.textContent = "\u2191";
    upBtn.addEventListener("click", () =>
      emit("action:reorderGroup", { groupId: group.id, direction: -1 })
    );

    const downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.className = "preset-item__btn";
    downBtn.textContent = "\u2193";
    downBtn.addEventListener("click", () =>
      emit("action:reorderGroup", { groupId: group.id, direction: 1 })
    );

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "preset-item__btn";
    editBtn.textContent = t("action.edit");
    editBtn.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "preset-item__edit-input";
      input.value = group.name;
      name.replaceWith(input);
      input.focus();

      const commitRename = () => {
        emit("action:renameGroup", { groupId: group.id, newName: input.value });
      };
      input.addEventListener("blur", commitRename);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          input.removeEventListener("blur", commitRename);
          commitRename();
        }
      });
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "preset-item__btn preset-item__btn--danger";
    removeBtn.textContent = t("action.remove");
    removeBtn.addEventListener("click", () => emit("action:removePresetGroup", group.id));

    actions.appendChild(upBtn);
    actions.appendChild(downBtn);
    actions.appendChild(editBtn);
    actions.appendChild(removeBtn);

    item.appendChild(text);
    item.appendChild(actions);

    presetGroupListEl.appendChild(item);
  });
}

export function renderPresetValues() {
  if (!presetValueListEl) return;

  presetValueListEl.innerHTML = "";
  const activeGroup = state.presets.groups.find(
    (group) => group.id === state.presets.activeGroupId
  );

  if (!activeGroup) {
    const empty = document.createElement("li");
    empty.className = "muted";
    empty.textContent = t("empty.selectGroup");
    presetValueListEl.appendChild(empty);
    return;
  }

  if (activeGroup.values.length === 0) {
    const empty = document.createElement("li");
    empty.className = "muted";
    empty.textContent = t("empty.noValues");
    presetValueListEl.appendChild(empty);
    return;
  }

  activeGroup.values.forEach((value) => {
    const item = document.createElement("li");
    item.className = "preset-value";

    const text = document.createElement("span");
    text.textContent = value.label;

    const actions = document.createElement("div");
    actions.className = "preset-value__actions";

    const upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "preset-item__btn";
    upBtn.textContent = "\u2191";
    upBtn.addEventListener("click", () =>
      emit("action:reorderValue", {
        groupId: activeGroup.id,
        valueId: value.id,
        direction: -1,
      })
    );

    const downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.className = "preset-item__btn";
    downBtn.textContent = "\u2193";
    downBtn.addEventListener("click", () =>
      emit("action:reorderValue", {
        groupId: activeGroup.id,
        valueId: value.id,
        direction: 1,
      })
    );

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "preset-item__btn";
    editBtn.textContent = t("action.edit");
    editBtn.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "preset-item__edit-input";
      input.value = value.label;
      text.replaceWith(input);
      input.focus();

      const commitRename = () => {
        emit("action:renameValue", {
          groupId: activeGroup.id,
          valueId: value.id,
          newLabel: input.value,
        });
      };
      input.addEventListener("blur", commitRename);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          input.removeEventListener("blur", commitRename);
          commitRename();
        }
      });
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "preset-item__btn preset-item__btn--danger";
    removeBtn.textContent = t("action.remove");
    removeBtn.addEventListener("click", () =>
      emit("action:removePresetValue", { groupId: activeGroup.id, valueId: value.id })
    );

    actions.appendChild(upBtn);
    actions.appendChild(downBtn);
    actions.appendChild(editBtn);
    actions.appendChild(removeBtn);

    item.appendChild(text);
    item.appendChild(actions);
    presetValueListEl.appendChild(item);
  });
}

export function renderTabs() {
  tabButtons.forEach((btn) => {
    if (btn.dataset.tab === state.activeTab) {
      btn.classList.add("tab--active");
    } else {
      btn.classList.remove("tab--active");
    }
  });
  if (tabApplyEl) {
    tabApplyEl.classList.toggle("tab-content--hidden", state.activeTab !== "apply");
  }
  if (tabPresetsEl) {
    tabPresetsEl.classList.toggle("tab-content--hidden", state.activeTab !== "presets");
  }
}

export function renderStepper() {
  if (!stepperEl) return;
  stepperEl.innerHTML = "";

  for (let i = 0; i < 3; i++) {
    const stepNum = i + 1;

    if (i > 0) {
      const line = document.createElement("div");
      line.className = "stepper__line";
      if (stepNum < state.currentStep) {
        line.classList.add("stepper__line--done");
      } else if (stepNum === state.currentStep) {
        line.classList.add("stepper__line--active");
      }
      stepperEl.appendChild(line);
    }

    const stepDiv = document.createElement("div");
    stepDiv.className = "stepper__step";

    const circle = document.createElement("div");
    circle.className = "stepper__circle";

    if (stepNum < state.currentStep) {
      circle.classList.add("stepper__circle--done");
      circle.textContent = "\u2713";
      stepDiv.style.cursor = "pointer";
      stepDiv.addEventListener("click", () => {
        emit("action:goToStep", stepNum);
      });
    } else if (stepNum === state.currentStep) {
      circle.classList.add("stepper__circle--active");
      circle.textContent = stepNum;
    } else {
      circle.classList.add("stepper__circle--muted");
      circle.textContent = stepNum;
    }

    const label = document.createElement("span");
    label.className = "stepper__label";
    label.textContent = getStepLabels()[i];

    stepDiv.appendChild(circle);
    stepDiv.appendChild(label);
    stepperEl.appendChild(stepDiv);
  }
}

export function renderStep() {
  stepEls.forEach((el, i) => {
    if (!el) return;
    const stepNum = i + 1;
    if (stepNum === state.currentStep) {
      el.classList.remove("step--hidden");
    } else {
      el.classList.add("step--hidden");
    }
  });

  if (step1NextBtn) {
    step1NextBtn.disabled = state.images.length === 0;
  }
  if (step2NextBtn) {
    step2NextBtn.disabled = state.entries.length === 0;
  }

  renderStepper();
}

/* ========== Merge Modal ========== */

function isValueNew(srcValue, existingGroup) {
  if (!existingGroup) return true;
  return !existingGroup.values.some(
    (v) => v.value.toLowerCase() === srcValue.value.toLowerCase()
  );
}

function updateMergeSummary() {
  if (!mergeSummaryEl || !mergeState) return;
  let totalSelected = 0;
  let newGroups = 0;
  mergeState.selections.forEach((valueSet, groupId) => {
    totalSelected += valueSet.size;
    const srcGroup = mergeState.incoming.groups.find((g) => g.id === groupId);
    if (srcGroup) {
      const existingGroup = state.presets.groups.find(
        (g) => g.target.ifd === srcGroup.target.ifd && g.target.key === srcGroup.target.key
      );
      if (!existingGroup && valueSet.size > 0) newGroups++;
    }
  });
  mergeSummaryEl.textContent = totalSelected > 0
    ? t("count.mergeSelected", { count: totalSelected }) + (newGroups > 0 ? ` (${t("count.mergeNewGroups", { count: newGroups })})` : "")
    : t("empty.selectedNone");
}

function renderMergeContent() {
  if (!mergeContentEl || !mergeState) return;

  // Clear everything except mergeSummary
  const children = Array.from(mergeContentEl.children);
  children.forEach((child) => {
    if (child !== mergeSummaryEl) child.remove();
  });

  mergeState.incoming.groups.forEach((srcGroup) => {
    const existingGroup = state.presets.groups.find(
      (g) => g.target.ifd === srcGroup.target.ifd && g.target.key === srcGroup.target.key
    );

    const groupDiv = document.createElement("div");
    groupDiv.className = "merge-group";

    // Group header
    const header = document.createElement("label");
    header.className = "merge-group__header";

    const groupCheckbox = document.createElement("input");
    groupCheckbox.type = "checkbox";

    const selectedSet = mergeState.selections.get(srcGroup.id) || new Set();
    groupCheckbox.checked = selectedSet.size > 0;

    const tagHex = `0x${srcGroup.target.key.toString(16).padStart(4, "0")}`;
    const badge = document.createElement("span");
    badge.className = existingGroup ? "merge-label merge-label--exists" : "merge-label merge-label--new";
    badge.textContent = existingGroup ? t("merge.existsGroup") : t("merge.newGroup");

    header.appendChild(groupCheckbox);
    header.append(` ${srcGroup.name} [${srcGroup.target.ifd} ${tagHex}] `);
    header.appendChild(badge);

    // Values
    const valuesDiv = document.createElement("div");
    valuesDiv.className = "merge-group__values";

    srcGroup.values.forEach((srcValue) => {
      const valueNew = isValueNew(srcValue, existingGroup);

      const valueLabel = document.createElement("label");
      valueLabel.className = "merge-value";

      const valueCheckbox = document.createElement("input");
      valueCheckbox.type = "checkbox";
      valueCheckbox.checked = selectedSet.has(srcValue.id);

      const valueBadge = document.createElement("span");
      valueBadge.className = valueNew ? "merge-label merge-label--new" : "merge-label merge-label--exists";
      valueBadge.textContent = valueNew ? t("merge.newValue") : t("merge.existsValue");

      valueCheckbox.addEventListener("change", () => {
        let set = mergeState.selections.get(srcGroup.id);
        if (!set) {
          set = new Set();
          mergeState.selections.set(srcGroup.id, set);
        }
        if (valueCheckbox.checked) {
          set.add(srcValue.id);
        } else {
          set.delete(srcValue.id);
        }
        // Update group checkbox
        groupCheckbox.checked = set.size > 0;
        updateMergeSummary();
      });

      valueLabel.appendChild(valueCheckbox);
      valueLabel.append(` ${srcValue.label} `);
      valueLabel.appendChild(valueBadge);
      valuesDiv.appendChild(valueLabel);
    });

    // Group checkbox toggles all values
    groupCheckbox.addEventListener("change", () => {
      let set = mergeState.selections.get(srcGroup.id);
      if (!set) {
        set = new Set();
        mergeState.selections.set(srcGroup.id, set);
      }
      if (groupCheckbox.checked) {
        srcGroup.values.forEach((v) => set.add(v.id));
      } else {
        set.clear();
      }
      // Re-render to update value checkboxes
      renderMergeContent();
    });

    groupDiv.appendChild(header);
    groupDiv.appendChild(valuesDiv);
    mergeContentEl.appendChild(groupDiv);
  });

  updateMergeSummary();
}

export function showMergeModal(incomingPresets) {
  mergeState = {
    incoming: incomingPresets,
    selections: new Map(),
  };

  // Auto-select new values (those that don't exist in current presets)
  incomingPresets.groups.forEach((srcGroup) => {
    const existingGroup = state.presets.groups.find(
      (g) => g.target.ifd === srcGroup.target.ifd && g.target.key === srcGroup.target.key
    );

    const newValueIds = new Set();
    srcGroup.values.forEach((srcValue) => {
      if (isValueNew(srcValue, existingGroup)) {
        newValueIds.add(srcValue.id);
      }
    });

    if (newValueIds.size > 0) {
      mergeState.selections.set(srcGroup.id, newValueIds);
    }
  });

  renderMergeContent();
  if (mergeOverlayEl) {
    mergeOverlayEl.classList.add("modal-overlay--visible");
  }
}

export function hideMergeModal() {
  if (mergeOverlayEl) {
    mergeOverlayEl.classList.remove("modal-overlay--visible");
  }
  mergeState = null;
}

export function getMergeSelections() {
  if (!mergeState) return [];
  const result = [];
  mergeState.selections.forEach((valueSet, groupId) => {
    if (valueSet.size > 0) {
      result.push({ groupId, valueIds: [...valueSet] });
    }
  });
  return result;
}

export function getMergeIncoming() {
  return mergeState?.incoming || null;
}

const presetSearchEl = document.getElementById("presetSearch");

export function initUI() {
  const presetSearchInput = presetSearchEl;

  on("entries", renderEntries);
  on("entries", renderEntryChips);
  on("images", renderImages);
  on("images", renderThumbnails);
  on("presets", () => {
    renderPresetGroups();
    renderPresetValues();
    renderPresetCards(presetSearchInput ? presetSearchInput.value : "");
  });
  on("entries", () => {
    renderPresetCards(presetSearchInput ? presetSearchInput.value : "");
  });
  on("films", () => {
    const filmSearchEl = document.getElementById("filmSearch");
    renderFilmCards(filmSearchEl?.value || "");
  });
  on("films", renderFilmList);
  on("action:filmListFilter", (filter) => {
    filmListFilter = filter;
    filmListPage = 1;
    renderFilmList();
  });
  on("tab", renderTabs);
  on("step", renderStep);
  on("step", renderApplySummary);
  on("images", renderStep);
  on("images", renderApplySummary);
  on("entries", renderStep);
  on("entries", renderApplySummary);

  renderEntries();
  renderEntryChips();
  renderImages();
  renderThumbnails();
  renderPresetGroups();
  renderPresetValues();
  renderPresetCards();
  renderFilmCards();
  renderFilmList();
  renderApplySummary();
  renderTabs();
  renderStep();
}

export function rerenderAll() {
  renderTabs();
  renderStep();
  renderThumbnails();
  renderPresetCards(presetSearchEl?.value || "");
  renderEntryChips();
  renderApplySummary();
  renderEntries();
  renderImages();
  renderPresetGroups();
  renderPresetValues();
  renderFilmCards();
  renderFilmList();
}
