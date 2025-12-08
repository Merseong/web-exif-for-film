import { state } from "./state.js";

export const COMMON_IFD0_TAGS = [
  { key: 0x010e, label: "ImageDescription" },
  { key: 0x010f, label: "Make" },
  { key: 0x0110, label: "Model" },
  { key: 0x0112, label: "Orientation" },
  { key: 0x011a, label: "XResolution" },
  { key: 0x011b, label: "YResolution" },
  { key: 0x0128, label: "ResolutionUnit" },
  { key: 0x0131, label: "Software" },
  { key: 0x0132, label: "DateTime" },
  { key: 0x013b, label: "Artist" },
  { key: 0x8298, label: "Copyright" },
];

function parseKey(keyInput) {
  const trimmed = keyInput.trim();
  if (!trimmed) return null;
  const radix = trimmed.startsWith("0x") || trimmed.startsWith("0X") ? 16 : 10;
  const parsed = parseInt(trimmed, radix);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeValue(value) {
  if (value.trim() === "") return "";
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber)) return asNumber;
  return value;
}

function applyEntriesToDataUrl(dataUrl, entries) {
  try {
    const exifData = piexif.load(dataUrl);
    const updated = { ...exifData };

    entries.forEach((entry) => {
      const { ifd, key, value } = entry;
      if (!updated[ifd]) {
        updated[ifd] = {};
      }
      updated[ifd][key] = value;
    });

    const exifBytes = piexif.dump(updated);
    return piexif.insert(exifBytes, dataUrl);
  } catch (error) {
    console.error("EXIF apply error", error);
    throw new Error("Failed to apply EXIF data to the image.");
  }
}

export function addEntry(ifd, keyInput, valueInput, label = null) {
  const key = parseKey(keyInput);
  if (key === null) {
    throw new Error("Key must be decimal or hex (prefix with 0x).");
  }
  const value = normalizeValue(valueInput);
  const keyHex = `0x${key.toString(16).padStart(4, "0")}`;
  state.entries.push({
    id: `${ifd}-${key}-${state.entries.length + 1}`,
    ifd,
    key,
    keyHex,
    label,
    value,
    original: valueInput,
  });
}

export function clearEntries() {
  state.entries = [];
}

export function removeEntry(entryId) {
  state.entries = state.entries.filter((entry) => entry.id !== entryId);
}

export function applyExifToImages() {
  if (state.images.length === 0) {
    return { success: false, message: "Please upload at least one image." };
  }

  if (state.entries.length === 0) {
    return { success: false, message: "No EXIF entries to apply." };
  }

  try {
    state.images = state.images.map((image) => ({
      ...image,
      dataUrl: applyEntriesToDataUrl(image.dataUrl, state.entries),
    }));

    return {
      success: true,
      message: `${state.entries.length} entries applied to ${state.images.length} image(s).`,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
