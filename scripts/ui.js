import { state } from "./state.js";

const uploadStatusEl = document.getElementById("uploadStatus");
const applyStatusEl = document.getElementById("applyStatus");
const imageListEl = document.getElementById("imageList");
const entryItemsEl = document.getElementById("entryItems");
const presetGroupListEl = document.getElementById("presetGroupList");
const presetValueListEl = document.getElementById("presetValueList");
const presetGroupSelectEl = document.getElementById("activePresetGroup");
const presetStatusEl = document.getElementById("presetStatus");

let onRemoveImage = () => {};
let onRemoveEntry = () => {};
let onRemovePresetGroup = () => {};
let onApplyPresetValue = () => {};
let onRemovePresetValue = () => {};

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

export function registerRemoveHandlers({ image, entry }) {
  onRemoveImage = image || onRemoveImage;
  onRemoveEntry = entry || onRemoveEntry;
}

export function registerPresetHandlers({
  removeGroup,
  applyValue,
  removeValue,
} = {}) {
  onRemovePresetGroup = removeGroup || onRemovePresetGroup;
  onApplyPresetValue = applyValue || onApplyPresetValue;
  onRemovePresetValue = removeValue || onRemovePresetValue;
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

export function renderEntries() {
  entryItemsEl.innerHTML = "";
  if (state.entries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "muted";
    empty.textContent = "No EXIF entries yet.";
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
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => {
      onRemoveEntry(entry.id);
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
    empty.textContent = "No images loaded yet.";
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
    download.textContent = "Download";

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "button button--ghost";
    remove.textContent = "Remove from list";
    remove.addEventListener("click", () => onRemoveImage(image.id));

    actions.appendChild(remove);
    actions.appendChild(download);

    body.appendChild(title);
    body.appendChild(meta);
    body.appendChild(actions);

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
    empty.textContent = "Add a group to start building presets.";
    presetGroupListEl.appendChild(empty);

    const placeholder = document.createElement("option");
    placeholder.textContent = "No groups yet";
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

    const text = document.createElement("div");
    text.className = "preset-item__text";

    const name = document.createElement("strong");
    name.textContent = group.name;

    const meta = document.createElement("p");
    meta.className = "preset-item__meta";
    meta.textContent = `${group.target.label || "Tag"} • ${
      group.target.ifd
    } • 0x${group.target.key.toString(16).padStart(4, "0")}`;

    text.appendChild(name);
    text.appendChild(meta);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "button button--ghost";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => onRemovePresetGroup(group.id));

    item.appendChild(text);
    item.appendChild(remove);

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
    empty.textContent = "Select a group to view its values.";
    presetValueListEl.appendChild(empty);
    return;
  }

  if (activeGroup.values.length === 0) {
    const empty = document.createElement("li");
    empty.className = "muted";
    empty.textContent = "No saved values yet. Add one below.";
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

    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className = "button button--secondary";
    applyBtn.textContent = "Apply";
    applyBtn.addEventListener("click", () =>
      onApplyPresetValue(activeGroup.id, value.id)
    );

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "button button--ghost";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () =>
      onRemovePresetValue(activeGroup.id, value.id)
    );

    actions.appendChild(applyBtn);
    actions.appendChild(removeBtn);

    item.appendChild(text);
    item.appendChild(actions);
    presetValueListEl.appendChild(item);
  });
}
