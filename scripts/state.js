export const state = {
  images: [], // { id, name, size, dataUrl }
  entries: [], // { id, ifd, key, keyHex, label, value, original }
  presets: { groups: [], activeGroupId: null }, // { groups, activeGroupId }
};

let idCounter = 0;

export function nextId() {
  idCounter += 1;
  return idCounter.toString();
}

export function resetState() {
  state.images = [];
  state.entries = [];
  idCounter = 0;
}
