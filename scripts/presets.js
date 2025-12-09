import { state } from "./state.js";

const STORAGE_KEY = "exifPresetGroups";

const DEFAULT_PRESETS = {
  version: 1,
  activeGroupId: "film",
  groups: [
    {
      id: "film",
      name: "Film",
      target: { ifd: "0th", key: 0x0110, label: "Model" },
      values: [
        "kodak_ultramax_400",
        "kodak_gold_200",
        "kodak_ektar_100",
        "kodak_portra_160",
        "harman_phoenix_200",
        "cinestill_800T",
        "cinestill_400D",
        "kodak_ektarchrome_e100d",
        "kodak_ektarchrome_e100",
        "kentmere_pan_100",
      ],
    },
  ],
};

function clonePresets(data) {
  return JSON.parse(JSON.stringify(data));
}

function persistPresets() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.presets));
}

function generateId(prefix = "preset") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeTarget(target) {
  if (!target) return null;
  const ifd = typeof target.ifd === "string" ? target.ifd : null;
  const key = Number.parseInt(target.key, 10);
  if (!ifd || Number.isNaN(key)) return null;
  return { ifd, key, label: target.label || "" };
}

function normalizeValueItem(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    return { id: generateId("value"), label: trimmed, value: trimmed };
  }

  if (value && typeof value === "object") {
    const base = typeof value.label === "string" ? value.label : value.value;
    const clean = typeof base === "string" ? base.trim() : "";
    if (!clean) return null;
    const resolvedValue =
      typeof value.value === "string" && value.value.trim()
        ? value.value.trim()
        : clean;
    return {
      id: value.id || generateId("value"),
      label: clean,
      value: resolvedValue,
    };
  }

  return null;
}

function normalizeGroup(group) {
  if (!group || typeof group !== "object") return null;
  const name = typeof group.name === "string" ? group.name.trim() : "";
  const target = normalizeTarget(group.target);
  if (!name || !target) return null;

  const values = Array.isArray(group.values)
    ? group.values.map(normalizeValueItem).filter(Boolean)
    : [];

  return {
    id: group.id || generateId("group"),
    name,
    target,
    values,
  };
}

function normalizePresets(raw) {
  const parsed = raw && typeof raw === "object" ? raw : {};
  const groups = Array.isArray(parsed.groups)
    ? parsed.groups.map(normalizeGroup).filter(Boolean)
    : [];

  if (groups.length === 0) {
    return normalizePresets(clonePresets(DEFAULT_PRESETS));
  }

  let activeGroupId = parsed.activeGroupId;
  if (!groups.some((group) => group.id === activeGroupId)) {
    activeGroupId = groups[0].id;
  }

  return {
    version: 1,
    groups,
    activeGroupId,
  };
}

function loadPresetsFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return normalizePresets(JSON.parse(stored));
  } catch (error) {
    console.warn("Failed to parse stored presets, falling back to defaults.", error);
    return null;
  }
}

export function initPresetStore() {
  const loaded = loadPresetsFromStorage();
  state.presets = loaded || normalizePresets(clonePresets(DEFAULT_PRESETS));
  if (!state.presets.activeGroupId && state.presets.groups.length > 0) {
    state.presets.activeGroupId = state.presets.groups[0].id;
  }
  persistPresets();
  return state.presets;
}

export function getPresetGroups() {
  return state.presets.groups;
}

export function getActivePresetGroup() {
  return state.presets.groups.find(
    (group) => group.id === state.presets.activeGroupId
  );
}

export function setActivePresetGroup(groupId) {
  const exists = state.presets.groups.some((group) => group.id === groupId);
  if (!exists) return;
  state.presets.activeGroupId = groupId;
  persistPresets();
}

export function addPresetGroup({ name, ifd, key, label }) {
  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error("Group name is required.");
  }

  const parsedKey = Number.parseInt(key, 10);
  if (Number.isNaN(parsedKey)) {
    throw new Error("Select a valid EXIF tag.");
  }

  if (!ifd) {
    throw new Error("IFD is required.");
  }

  const newGroup = {
    id: generateId("group"),
    name: cleanName,
    target: { ifd, key: parsedKey, label: label || "" },
    values: [],
  };

  state.presets.groups.push(newGroup);
  state.presets.activeGroupId = newGroup.id;
  persistPresets();
  return newGroup;
}

export function removePresetGroup(groupId) {
  state.presets.groups = state.presets.groups.filter(
    (group) => group.id !== groupId
  );
  if (!state.presets.groups.some((group) => group.id === state.presets.activeGroupId)) {
    state.presets.activeGroupId =
      state.presets.groups.length > 0 ? state.presets.groups[0].id : null;
  }
  persistPresets();
}

export function addPresetValue(groupId, valueLabel) {
  const group = state.presets.groups.find((item) => item.id === groupId);
  if (!group) {
    throw new Error("Select or create a group first.");
  }
  const trimmed = valueLabel.trim();
  if (!trimmed) {
    throw new Error("Value is required.");
  }

  const duplicate = group.values.some(
    (item) => item.value.toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) {
    throw new Error("This value already exists in the selected group.");
  }

  const value = { id: generateId("value"), label: trimmed, value: trimmed };
  group.values.push(value);
  persistPresets();
  return value;
}

export function removePresetValue(groupId, valueId) {
  const group = state.presets.groups.find((item) => item.id === groupId);
  if (!group) return;
  group.values = group.values.filter((value) => value.id !== valueId);
  persistPresets();
}

export function getPresetValue(groupId, valueId) {
  const group = state.presets.groups.find((item) => item.id === groupId);
  if (!group) return null;
  const value = group.values.find((item) => item.id === valueId);
  if (!value) return null;
  return { group, value };
}

export function exportPresetJson() {
  return JSON.stringify(state.presets, null, 2);
}

export async function importPresetFile(file) {
  const text = await file.text();
  return importPresetJson(text);
}

export function importPresetJson(text) {
  const parsed = JSON.parse(text);
  state.presets = normalizePresets(parsed);
  persistPresets();
  return state.presets;
}
