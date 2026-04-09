import { state, emit } from "./state.js";

const STORAGE_KEY = "exifFilmPresets";

// ISO tag is fixed, not configurable
const FILM_ISO_TAG = { ifd: "Exif", key: 0x8827, label: "ISOSpeedRatings" };

const DEFAULT_FILM_TARGET = { ifd: "0th", key: 0x0110, label: "Model" };

const DEFAULT_FILMS = {
  version: 1,
  targetTag: { ...DEFAULT_FILM_TARGET },
  films: [
    // Kodak Color Negative
    { id: "film-1", name: "kodak_portra_160", iso: 160 },
    { id: "film-2", name: "kodak_portra_400", iso: 400 },
    { id: "film-3", name: "kodak_portra_800", iso: 800 },
    { id: "film-4", name: "kodak_ektar_100", iso: 100 },
    { id: "film-5", name: "kodak_gold_200", iso: 200 },
    { id: "film-6", name: "kodak_ultramax_400", iso: 400 },
    { id: "film-7", name: "kodak_colorplus_200", iso: 200 },
    // Kodak B&W
    { id: "film-8", name: "kodak_tri-x_400", iso: 400 },
    { id: "film-9", name: "kodak_tmax_100", iso: 100 },
    { id: "film-10", name: "kodak_tmax_400", iso: 400 },
    { id: "film-11", name: "kodak_tmax_p3200", iso: 3200 },
    // Kodak Slide
    { id: "film-12", name: "kodak_ektachrome_e100", iso: 100 },
    { id: "film-13", name: "kodak_ektachrome_e100d", iso: 100 },
    // Fujifilm Color Negative
    { id: "film-14", name: "fuji_superia_400", iso: 400 },
    { id: "film-15", name: "fuji_superia_premium_400", iso: 400 },
    { id: "film-16", name: "fuji_c200", iso: 200 },
    { id: "film-17", name: "fuji_pro_400h", iso: 400 },
    // Fujifilm Slide
    { id: "film-18", name: "fuji_velvia_50", iso: 50 },
    { id: "film-19", name: "fuji_velvia_100", iso: 100 },
    { id: "film-20", name: "fuji_provia_100f", iso: 100 },
    // Fujifilm B&W
    { id: "film-21", name: "fuji_acros_100_ii", iso: 100 },
    // Ilford B&W
    { id: "film-22", name: "ilford_hp5_plus_400", iso: 400 },
    { id: "film-23", name: "ilford_fp4_plus_125", iso: 125 },
    { id: "film-24", name: "ilford_delta_100", iso: 100 },
    { id: "film-25", name: "ilford_delta_400", iso: 400 },
    { id: "film-26", name: "ilford_delta_3200", iso: 3200 },
    { id: "film-27", name: "ilford_pan_f_plus_50", iso: 50 },
    { id: "film-28", name: "ilford_xp2_super_400", iso: 400 },
    // Cinestill
    { id: "film-29", name: "cinestill_800T", iso: 800 },
    { id: "film-30", name: "cinestill_400D", iso: 400 },
    { id: "film-31", name: "cinestill_50D", iso: 50 },
    // Harman
    { id: "film-32", name: "harman_phoenix_200", iso: 200 },
    // Kentmere
    { id: "film-33", name: "kentmere_pan_100", iso: 100 },
    { id: "film-34", name: "kentmere_pan_400", iso: 400 },
    // Foma
    { id: "film-35", name: "fomapan_100", iso: 100 },
    { id: "film-36", name: "fomapan_200", iso: 200 },
    { id: "film-37", name: "fomapan_400", iso: 400 },
    // Rollei
    { id: "film-38", name: "rollei_rpx_25", iso: 25 },
    { id: "film-39", name: "rollei_rpx_100", iso: 100 },
    { id: "film-40", name: "rollei_rpx_400", iso: 400 },
    // Lomography
    { id: "film-41", name: "lomo_color_negative_400", iso: 400 },
    { id: "film-42", name: "lomo_color_negative_800", iso: 800 },
    { id: "film-43", name: "lomochrome_purple_400", iso: 400 },
    // Shanghai
    { id: "film-44", name: "shanghai_gp3_100", iso: 100 },
  ],
};

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `film-${crypto.randomUUID()}`;
  }
  return `film-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cloneFilms(data) {
  return JSON.parse(JSON.stringify(data));
}

function persistFilms() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.filmPresets));
  emit("films");
}

function normalizeFilmStore(raw) {
  const parsed = raw && typeof raw === "object" ? raw : {};
  const films = Array.isArray(parsed.films)
    ? parsed.films
        .filter((f) => f && typeof f.name === "string" && f.name.trim())
        .map((f) => ({
          id: f.id || generateId(),
          name: f.name.trim(),
          iso: Number.isFinite(Number(f.iso)) ? Number(f.iso) : 0,
        }))
    : [];

  let targetTag = DEFAULT_FILM_TARGET;
  if (parsed.targetTag && parsed.targetTag.ifd && Number.isFinite(parsed.targetTag.key)) {
    targetTag = {
      ifd: parsed.targetTag.ifd,
      key: Number(parsed.targetTag.key),
      label: parsed.targetTag.label || "",
    };
  }

  if (films.length === 0) {
    return cloneFilms(DEFAULT_FILMS);
  }

  return { version: 1, targetTag, films };
}

export function initFilmStore() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      state.filmPresets = normalizeFilmStore(JSON.parse(stored));
    } else {
      state.filmPresets = cloneFilms(DEFAULT_FILMS);
    }
  } catch {
    state.filmPresets = cloneFilms(DEFAULT_FILMS);
  }
  persistFilms();
}

export function getFilms() {
  return state.filmPresets.films;
}

export function getFilmTargetTag() {
  return state.filmPresets.targetTag;
}

export function getFilmIsoTag() {
  return FILM_ISO_TAG;
}

export function setFilmTargetTag(ifd, key, label) {
  state.filmPresets.targetTag = { ifd, key: Number(key), label: label || "" };
  persistFilms();
}

export function addFilm(name, iso) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Film name is required.");
  const isoNum = Number(iso);
  if (!Number.isFinite(isoNum) || isoNum < 0) throw new Error("Valid ISO is required.");

  const duplicate = state.filmPresets.films.some(
    (f) => f.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) throw new Error("This film already exists.");

  const film = { id: generateId(), name: trimmed, iso: isoNum };
  state.filmPresets.films.push(film);
  persistFilms();
  return film;
}

export function removeFilm(filmId) {
  state.filmPresets.films = state.filmPresets.films.filter((f) => f.id !== filmId);
  persistFilms();
}

export function renamFilm(filmId, newName, newIso) {
  const film = state.filmPresets.films.find((f) => f.id === filmId);
  if (!film) return;
  const trimmed = newName.trim();
  if (trimmed) film.name = trimmed;
  const isoNum = Number(newIso);
  if (Number.isFinite(isoNum) && isoNum >= 0) film.iso = isoNum;
  persistFilms();
}

export function reorderFilm(filmId, direction) {
  const idx = state.filmPresets.films.findIndex((f) => f.id === filmId);
  if (idx < 0) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= state.filmPresets.films.length) return;
  const temp = state.filmPresets.films[idx];
  state.filmPresets.films[idx] = state.filmPresets.films[newIdx];
  state.filmPresets.films[newIdx] = temp;
  persistFilms();
}

export function hardClearFilms() {
  state.filmPresets = { version: 1, targetTag: { ...DEFAULT_FILM_TARGET }, films: [] };
  persistFilms();
}

export function resetFilmsToDefault() {
  state.filmPresets = cloneFilms(DEFAULT_FILMS);
  persistFilms();
}

export function getDefaultFilms() {
  return cloneFilms(DEFAULT_FILMS);
}

export function exportFilmJson() {
  return JSON.stringify(state.filmPresets, null, 2);
}

export function importFilmJson(text) {
  const parsed = JSON.parse(text);
  state.filmPresets = normalizeFilmStore(parsed);
  persistFilms();
}

export function mergeFilms(incoming) {
  const normalized = normalizeFilmStore(incoming);
  normalized.films.forEach((film) => {
    const duplicate = state.filmPresets.films.some(
      (f) => f.name.toLowerCase() === film.name.toLowerCase()
    );
    if (!duplicate) {
      state.filmPresets.films.push({
        id: generateId(),
        name: film.name,
        iso: film.iso,
      });
    }
  });
  persistFilms();
}
