import { nextId, state } from "./state.js";
import {
  renderImages,
  showLoading,
  hideLoading,
  updateUploadStatus,
} from "./ui.js";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function toReadableSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function handleFiles(fileList) {
  if (!fileList || fileList.length === 0) {
    updateUploadStatus("No files selected.", "warning");
    return;
  }

  const files = Array.from(fileList).filter(
    (file) => file.type === "image/jpeg"
  );
  if (files.length === 0) {
    updateUploadStatus("Only JPEG images are supported.", "error");
    return;
  }

  showLoading("Loading images...");
  try {
    updateUploadStatus("Loading images...", "");
    const results = await Promise.all(
      files.map(async (file) => {
        const dataUrl = await readFileAsDataUrl(file);
        return {
          id: nextId(),
          name: file.name,
          size: toReadableSize(file.size),
          dataUrl,
        };
      })
    );

    state.images.push(...results);
    updateUploadStatus(`${results.length} image(s) loaded.`, "success");
    renderImages();
  } finally {
    hideLoading();
  }
}

export function removeImage(imageId) {
  state.images = state.images.filter((img) => img.id !== imageId);
  renderImages();
}
