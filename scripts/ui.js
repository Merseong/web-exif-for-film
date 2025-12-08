import { state } from "./state.js";

const uploadStatusEl = document.getElementById("uploadStatus");
const applyStatusEl = document.getElementById("applyStatus");
const imageListEl = document.getElementById("imageList");
const entryItemsEl = document.getElementById("entryItems");

let onRemoveImage = () => {};
let onRemoveEntry = () => {};

function setStatus(el, message, tone) {
  el.className = "status";
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

export function updateUploadStatus(message, tone) {
  setStatus(uploadStatusEl, message, tone);
}

export function updateApplyStatus(message, tone) {
  setStatus(applyStatusEl, message, tone);
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
