export const state = {
  images: [], // { id, name, size, dataUrl }
  entries: [], // { id, ifd, key, keyHex, label, value, original }
  presets: { groups: [], activeGroupId: null }, // { groups, activeGroupId }
  activeTab: "apply", // "apply" | "presets"
  currentStep: 1, // 1 | 2 | 3
};

const listeners = new Map();

export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, []);
  listeners.get(event).push(fn);
}

export function emit(event, detail) {
  listeners.get(event)?.forEach((fn) => fn(detail));
}

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
