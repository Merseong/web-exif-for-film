# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Browser-only EXIF batch editor for scanned film images. Users upload JPEGs, define EXIF tag/value pairs (manually or via presets), apply them in bulk, and download the modified files. No server — everything runs client-side.

## Development

No build step, bundler, or package manager. Open `index.html` directly or serve with any static server:

```bash
python3 -m http.server 8000
# or
npx serve .
```

The only external dependency is **piexifjs**, loaded from CDN (`<script src="https://cdn.jsdelivr.net/npm/piexifjs">`). It exposes a global `piexif` object used in `scripts/exifEditor.js` and `scripts/ui.js`.

No test framework or linter is configured.

## Architecture

All JS uses ES modules (`type="module"` in `index.html`).

### UI Structure

Two-tab layout with a 3-step wizard:

- **Tab: EXIF 적용** — Step 1 (이미지 업로드) → Step 2 (프리셋 선택 + 수동 태그) → Step 3 (적용 & 다운로드)
- **Tab: 프리셋 관리** — 그룹/값 CRUD, 이름 편집, 순서 변경, JSON Export/Import/Merge

### Modules

- **`scripts/state.js`** — Single mutable state object + event bus (`on`/`emit`). State fields: `images`, `entries`, `presets`, `activeTab`, `currentStep`.
- **`scripts/main.js`** — Entry point. Wires DOM event listeners, handles tab/step navigation, dispatches action events to other modules.
- **`scripts/exifEditor.js`** — EXIF tag definitions (`COMMON_IFD0_TAGS`, `COMMON_EXIF_TAGS`), entry CRUD (`addEntry`/`setEntry`/`removeEntry`/`clearEntries`), and `applyExifToImages()`. Emits `"entries"` or `"images"` after mutations.
- **`scripts/fileHandler.js`** — Reads uploaded files as data URLs via `FileReader`, pushes to `state.images`, emits `"images"`. Returns result objects (no UI dependency).
- **`scripts/presets.js`** — Preset groups CRUD + `renameGroup`/`renameValue`/`reorderGroup`/`reorderValue`/`mergePresets`. Persisted to `localStorage`. Emits `"presets"` via `persistPresets()`.
- **`scripts/ui.js`** — All DOM rendering. Subscribes to state events for auto-rendering via `initUI()`.

### Event Bus

State changes trigger automatic UI updates:

```
module mutates state → emit("images"/"entries"/"presets") → ui.js auto-renders
```

UI action events (`"action:*"`) flow from ui.js to main.js:
- `action:removeImage`, `action:removeEntry`, `action:removePresetGroup`
- `action:applyPresetValue`, `action:removePresetValue`
- `action:renameGroup`, `action:renameValue`, `action:reorderGroup`, `action:reorderValue`
- `action:setActiveGroup`, `action:goToStep`

Navigation events: `"tab"`, `"step"` — triggered by main.js when user switches tabs or steps.

### Key Conventions

- EXIF tags are identified by numeric key + IFD string (`"0th"` or `"Exif"`). Hex display format: `0x` + 4-digit padded hex.
- Images are stored as base64 data URLs in memory. piexifjs operates on these directly.
- CSS uses custom properties defined in `:root` (dark theme). BEM-like class naming (`block__element--modifier`).
- Font stack: Pretendard, Inter, system-ui.
- Preset merge duplicate detection: groups matched by `target.ifd + target.key`, values by case-insensitive string comparison.
