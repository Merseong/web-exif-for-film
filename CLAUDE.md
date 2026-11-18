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

### Rules

- 사용자에게 표시되는 문자열을 추가/변경할 때, `scripts/i18n.js`의 3개 로케일(ko, en, ja)에 반드시 번역 키를 추가할 것. HTML에는 `data-i18n` / `data-i18n-placeholder` 속성을, JS에서는 `t("key")` 호출을 사용.

### Key Conventions

- EXIF tags are identified by numeric key + IFD string (`"0th"` or `"Exif"`). Hex display format: `0x` + 4-digit padded hex.
- Images are stored as base64 data URLs in memory. piexifjs operates on these directly.
- CSS uses custom properties defined in `:root` (dark theme). BEM-like class naming (`block__element--modifier`).
- Font stack: Pretendard, Inter, system-ui.
- Preset merge duplicate detection: groups matched by `target.ifd + target.key`, values by case-insensitive string comparison.

<!-- EXPERIMENTAL:code-mode-style START (2026-11-18 추가) — 효과가 없으면 이 START~END 블록을 통째로 지운다 -->
## [실험] 도구 호출 묶기 (Code Mode 방식 흉내)

> **실험 중인 지침.** Claude Code의 실험 기능 `CLAUDE_CODE_EXPERIMENTAL_CODE_MODE`가 하는 일(도구 호출을 코드 한 번으로 묶고, 중간 결과는 코드 안에서 걸러 요약만 남김)을 일반 도구로 흉내 낸다. 이 파일의 다른 지침과 부딪히면 **다른 지침을 따른다.**

- **서로 기다릴 필요 없는 호출은 한 응답에 병렬로** 보낸다 (파일 여러 개 읽기, 독립 검색, 상태 확인 여러 개).
- **같은 일을 여러 건 반복할 땐** 도구를 N번 부르지 말고 `node`/`python3`/셸 스크립트 하나로 돌린다. 스크립트는 세션 scratchpad에 두고, 출력은 건수·실패 항목·요약만 찍는다 (원본 전체를 컨텍스트에 붓지 않는다).
- **큰 출력은 파일로** 받고 `grep`/`jq`/`head`로 필요한 부분만 본다.
- **묶지 않는 것**: 코드 수정, 배포·마이그레이션·삭제처럼 되돌리기 어려운 작업, 앞 결과를 보고 판단해야 하는 단계. 이런 건 한 단계씩 확인하며 진행한다.
- 진짜 Code Mode는 터미널에서 `CLAUDE_CODE_EXPERIMENTAL_CODE_MODE=1 claude`로 띄울 때만 켜진다 (VSCode 확장·`-p`·백그라운드 세션에서는 안 켜지고, 켜면 Chrome/computer use·Remote Control이 꺼진다). 이 레포의 설정 파일에는 넣지 않는다.
<!-- EXPERIMENTAL:code-mode-style END -->
