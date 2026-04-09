import { nextId, state, emit } from "./state.js";

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
    return { message: "No files selected.", tone: "warning" };
  }

  const files = Array.from(fileList).filter(
    (file) => file.type === "image/jpeg"
  );
  if (files.length === 0) {
    return { message: "Only JPEG images are supported.", tone: "error" };
  }

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
  emit("images");
  return { message: `${results.length} image(s) loaded.`, tone: "success" };
}

export function removeImage(imageId) {
  state.images = state.images.filter((img) => img.id !== imageId);
  emit("images");
}
