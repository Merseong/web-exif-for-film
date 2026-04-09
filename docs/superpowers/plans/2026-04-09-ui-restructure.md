# UI/UX 구조 개선 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 4개 패널 나열 구조를 2-탭 + 3-단계 위자드로 재구성하고, 프리셋 관리에 이름 편집/순서 변경/Merge 기능을 추가한다.

**Architecture:** 기존 이벤트 버스(`on`/`emit`)를 확장하여 `activeTab`, `currentStep` 상태를 추가한다. `index.html`을 탭+위자드 구조로 전면 재작성하고, `ui.js`에 새로운 렌더 함수들을 추가한다. `presets.js`에 rename/reorder/merge 로직을 추가한다.

**Tech Stack:** Vanilla JS (ES modules), piexifjs (CDN), CSS custom properties

**Spec:** `docs/superpowers/specs/2026-04-09-ui-restructure-design.md`

---

### Task 1: State 확장 + HTML 스켈레톤 + 기본 CSS

**Files:**
- Modify: `scripts/state.js`
- Rewrite: `index.html`
- Modify: `css/style.css`

- [ ] **Step 1: state.js에 activeTab, currentStep 추가**

```js
export const state = {
  images: [],
  entries: [],
  presets: { groups: [], activeGroupId: null },
  activeTab: "apply",   // "apply" | "presets"
  currentStep: 1,       // 1 | 2 | 3
};
```

- [ ] **Step 2: index.html 전면 재작성**

기존 `<header class="hero">` + `<main class="layout">` 내 4개 `<section class="panel">` 을 제거하고 아래 구조로 교체:

```html
<header class="hero">
  <div class="hero__content">
    <h1 class="hero__title">EXIF Batch Editor</h1>
    <p class="hero__subtitle">Upload JPEGs, set EXIF tags, download. All in-browser.</p>
  </div>
</header>

<main class="layout">
  <!-- Tab navigation -->
  <nav class="tabs">
    <button class="tab tab--active" data-tab="apply">EXIF 적용</button>
    <button class="tab" data-tab="presets">프리셋 관리</button>
  </nav>

  <!-- Tab: EXIF Apply -->
  <div id="tabApply" class="tab-content">
    <!-- Stepper -->
    <div id="stepper" class="stepper"></div>

    <!-- Step 1: Upload -->
    <div id="step1" class="step">
      <div class="step__body">
        <input id="fileInput" type="file" accept="image/jpeg" multiple hidden />
        <div id="dropZone" class="dropzone">
          <p class="dropzone__title">JPEG 파일을 드래그하거나 클릭</p>
          <p class="dropzone__subtitle">여러 파일을 한 번에 업로드할 수 있습니다</p>
        </div>
        <div id="uploadStatus" class="status"></div>
        <div id="thumbnailGrid" class="thumbnail-grid"></div>
      </div>
      <div class="step__nav">
        <div></div>
        <button id="step1Next" class="button" type="button" disabled>다음 →</button>
      </div>
    </div>

    <!-- Step 2: EXIF Settings -->
    <div id="step2" class="step step--hidden">
      <div class="step__body">
        <!-- Preset search -->
        <div class="preset-search">
          <input id="presetSearch" type="text" placeholder="프리셋 검색..." autocomplete="off" />
        </div>
        <!-- Preset card groups (rendered by JS) -->
        <div id="presetCardGroups" class="preset-card-groups"></div>

        <!-- Manual tag form -->
        <div class="step__divider"></div>
        <p class="section-label">수동 태그 추가</p>
        <form id="entryForm" class="entry-form">
          <label class="field">
            <span class="field__label">Tag</span>
            <select id="tagSelect" required></select>
          </label>
          <label class="field">
            <span class="field__label">Value</span>
            <input id="tagValue" type="text" placeholder="e.g., Olympus mju" autocomplete="off" required />
          </label>
          <button class="button" type="submit">추가</button>
        </form>

        <!-- Pending entries as chips -->
        <div id="entryChips" class="entry-chips"></div>
      </div>
      <div class="step__nav">
        <button id="step2Prev" class="button button--secondary" type="button">← 이전</button>
        <button id="step2Next" class="button" type="button" disabled>다음 →</button>
      </div>
    </div>

    <!-- Step 3: Apply & Download -->
    <div id="step3" class="step step--hidden">
      <div class="step__body">
        <div id="applySummary" class="apply-summary"></div>
        <div id="applyEntryList" class="apply-entry-list"></div>
        <div class="apply-actions">
          <button id="applyExif" class="button" type="button">EXIF 적용</button>
          <button id="downloadAll" class="button button--secondary" type="button">전체 다운로드</button>
        </div>
        <div id="applyStatus" class="status"></div>
        <div id="imageList" class="image-grid"></div>
      </div>
      <div class="step__nav">
        <button id="step3Prev" class="button button--secondary" type="button">← 이전</button>
        <div></div>
      </div>
    </div>
  </div>

  <!-- Tab: Preset Management -->
  <div id="tabPresets" class="tab-content tab-content--hidden">
    <div class="preset-mgmt__header">
      <h2>프리셋 관리</h2>
      <div class="preset-mgmt__actions">
        <button id="exportPresets" class="button button--secondary" type="button">Export JSON</button>
        <label class="button button--secondary" for="importPresetsInput">Import JSON</label>
        <input id="importPresetsInput" type="file" accept="application/json" hidden />
        <label class="button button--accent" for="mergePresetsInput">Merge</label>
        <input id="mergePresetsInput" type="file" accept="application/json" hidden />
      </div>
    </div>

    <div class="preset-grid">
      <!-- Left: Groups -->
      <div class="preset-column">
        <h3>그룹</h3>
        <form id="presetGroupForm" class="entry-form">
          <label class="field">
            <span class="field__label">그룹 이름</span>
            <input id="presetGroupName" type="text" placeholder="e.g., Film, Camera" autocomplete="off" required />
          </label>
          <label class="field">
            <span class="field__label">EXIF 태그</span>
            <select id="presetGroupTag" required></select>
          </label>
          <button class="button" type="submit">추가</button>
        </form>
        <ul id="presetGroupList" class="preset-list"></ul>
      </div>

      <!-- Right: Values -->
      <div class="preset-column">
        <div class="preset-column__header">
          <h3>값 목록</h3>
          <label class="field">
            <span class="field__label">활성 그룹</span>
            <select id="activePresetGroup"></select>
          </label>
        </div>
        <form id="presetValueForm" class="entry-form">
          <label class="field">
            <span class="field__label">값</span>
            <input id="presetValueInput" type="text" placeholder="e.g., kodak_ultramax_400" autocomplete="off" required />
          </label>
          <button class="button" type="submit">추가</button>
        </form>
        <ul id="presetValueList" class="preset-values"></ul>
      </div>
    </div>
    <div id="presetStatus" class="status"></div>
  </div>
</main>

<!-- Merge modal -->
<div id="mergeOverlay" class="modal-overlay">
  <div class="modal">
    <div class="modal__header">
      <h3>프리셋 Merge</h3>
      <button id="mergeClose" class="button button--ghost" type="button">✕</button>
    </div>
    <p class="muted">가져올 그룹과 값을 선택하세요.</p>
    <div id="mergeContent" class="merge-content"></div>
    <div class="modal__footer">
      <span id="mergeSummary" class="muted"></span>
      <div class="modal__actions">
        <button id="mergeCancel" class="button button--secondary" type="button">취소</button>
        <button id="mergeConfirm" class="button" type="button">Merge</button>
      </div>
    </div>
  </div>
</div>

<!-- Image detail overlay (keep existing) -->
<div id="imageDetailOverlay" class="image-detail">...</div>

<!-- Loading overlay (keep existing) -->
<div id="loadingOverlay" class="loading-overlay">...</div>
```

이미지 디테일 오버레이와 로딩 오버레이는 기존 HTML 그대로 유지.

- [ ] **Step 3: CSS에 탭, 스텝, 새 컴포넌트 스타일 추가**

`css/style.css` 끝에 추가할 새 스타일:

```css
/* --- Tabs --- */
.tabs {
  display: flex;
  border-bottom: 2px solid var(--border);
  margin-bottom: 24px;
}

.tab {
  appearance: none;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  padding: 14px 28px;
  font-size: 15px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  font-family: inherit;
}

.tab--active {
  color: var(--text);
  border-bottom-color: var(--accent);
}

.tab-content--hidden {
  display: none;
}

/* --- Stepper --- */
.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px 0 24px;
}

.stepper__step {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.stepper__step--disabled {
  opacity: 0.35;
  cursor: default;
}

.stepper__circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  border: 2px solid var(--border);
  color: var(--muted);
}

.stepper__circle--active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.stepper__circle--done {
  background: var(--success);
  border-color: var(--success);
  color: white;
}

.stepper__label {
  font-size: 12px;
}

.stepper__line {
  width: 40px;
  height: 2px;
  background: var(--border);
  margin: 0 4px;
}

.stepper__line--done {
  background: var(--success);
}

.stepper__line--active {
  background: var(--accent);
}

/* --- Steps --- */
.step--hidden {
  display: none;
}

.step__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step__nav {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
}

.step__divider {
  border-top: 1px dashed var(--border);
  margin: 8px 0;
}

/* --- Thumbnail grid (Step 1) --- */
.thumbnail-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.thumbnail {
  position: relative;
  width: 80px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.thumbnail__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail__remove {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--danger);
  border: none;
  color: white;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.thumbnail__name {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 2px 4px;
  font-size: 9px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

/* --- Preset card groups (Step 2) --- */
.preset-card-groups {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preset-card-group {
  transition: opacity 120ms ease;
}

.preset-card-group--dim {
  opacity: 0.4;
}

.preset-card-group__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 8px;
}

.preset-card-group__cards {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preset-card {
  appearance: none;
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: transparent;
  color: var(--text);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease;
}

.preset-card:hover {
  border-color: rgba(124, 58, 237, 0.4);
}

.preset-card--selected {
  border: 2px solid var(--accent);
  background: rgba(124, 58, 237, 0.12);
  font-weight: 600;
}

.preset-card-group__empty {
  font-size: 12px;
  color: var(--muted);
}

.preset-search input {
  width: 100%;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* --- Entry chips (Step 2) --- */
.entry-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  min-height: 44px;
}

.entry-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(124, 58, 237, 0.12);
  border-radius: 6px;
  font-size: 12px;
}

.entry-chip__remove {
  appearance: none;
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  font-family: inherit;
}

/* --- Apply summary (Step 3) --- */
.apply-summary {
  display: flex;
  gap: 12px;
}

.apply-summary__card {
  flex: 1;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
}

.apply-summary__label {
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 4px;
}

.apply-summary__value {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}

.apply-entry-list {
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
}

.apply-entry-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 13px;
}

.apply-entry-row:last-child {
  border-bottom: none;
}

.apply-actions {
  display: flex;
  gap: 10px;
}

.apply-actions .button {
  flex: 1;
  justify-content: center;
}

/* --- Preset management header --- */
.preset-mgmt__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 16px;
  gap: 16px;
}

.preset-mgmt__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.button--accent {
  background: rgba(124, 58, 237, 0.3);
  border: 1px solid rgba(124, 58, 237, 0.5);
  color: var(--text);
}

/* --- Preset item actions (reorder, edit, delete) --- */
.preset-item__actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.preset-item__btn {
  appearance: none;
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
  font-family: inherit;
}

.preset-item__btn--danger {
  color: var(--danger);
}

.preset-item__edit-input {
  background: var(--surface);
  border: 1px solid var(--accent);
  border-radius: 6px;
  padding: 4px 8px;
  color: var(--text);
  font-size: 14px;
  font-family: inherit;
  width: 100%;
}

/* --- Modal (Merge) --- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 160ms ease;
  z-index: 997;
  padding: 16px;
}

.modal-overlay--visible {
  opacity: 1;
  pointer-events: all;
}

.modal {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  width: min(520px, 100%);
  max-height: 80vh;
  overflow: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal__header h3 {
  margin: 0;
}

.modal__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.modal__actions {
  display: flex;
  gap: 8px;
}

/* --- Merge content --- */
.merge-group {
  border: 1px solid var(--border);
  border-radius: 10px;
  margin-bottom: 10px;
  overflow: hidden;
}

.merge-group__header {
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.merge-group__values {
  padding: 8px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.merge-value {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.merge-label {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: auto;
}

.merge-label--new {
  color: rgb(56, 189, 248);
  background: rgba(56, 189, 248, 0.1);
}

.merge-label--exists {
  color: var(--muted);
  background: rgba(255, 255, 255, 0.05);
}

/* --- Responsive --- */
@media (max-width: 680px) {
  .tabs {
    flex-direction: column;
  }

  .tab {
    border-bottom: none;
    border-left: 2px solid transparent;
  }

  .tab--active {
    border-left-color: var(--accent);
    border-bottom-color: transparent;
  }

  .step__nav {
    flex-direction: column;
    gap: 8px;
  }

  .apply-summary {
    flex-direction: column;
  }

  .preset-mgmt__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .apply-actions {
    flex-direction: column;
  }
}
```

- [ ] **Step 4: 브라우저에서 확인**

Run: `python3 -m http.server 8000` 으로 열고 페이지가 탭 구조로 로드되는지 확인. JS 에러가 콘솔에 없는지 확인. (이 시점에는 아직 동작하지 않고 구조만 잡힌 상태.)

- [ ] **Step 5: Commit**

```bash
git add index.html css/style.css scripts/state.js
git commit -m "feat: add tab+wizard HTML skeleton and CSS"
```

---

### Task 2: 탭 전환 + 위자드 네비게이션 (ui.js + main.js)

**Files:**
- Modify: `scripts/ui.js`
- Modify: `scripts/main.js`

- [ ] **Step 1: ui.js에 탭/스텝 렌더링 함수 추가**

`ui.js` 상단의 DOM 쿼리에 새 요소들 추가하고, 렌더링 함수를 작성:

```js
// 기존 DOM 쿼리 아래에 추가
const tabButtons = document.querySelectorAll(".tab");
const tabApplyEl = document.getElementById("tabApply");
const tabPresetsEl = document.getElementById("tabPresets");
const stepperEl = document.getElementById("stepper");
const stepEls = [
  document.getElementById("step1"),
  document.getElementById("step2"),
  document.getElementById("step3"),
];
const step1NextBtn = document.getElementById("step1Next");
const step2PrevBtn = document.getElementById("step2Prev");
const step2NextBtn = document.getElementById("step2Next");
const step3PrevBtn = document.getElementById("step3Prev");

const STEP_LABELS = ["업로드", "EXIF 설정", "적용 & 다운로드"];
```

`renderTabs()` — `state.activeTab`에 따라 `tab--active` 클래스와 `tab-content--hidden` 토글:

```js
export function renderTabs() {
  tabButtons.forEach((btn) => {
    btn.classList.toggle("tab--active", btn.dataset.tab === state.activeTab);
  });
  tabApplyEl.classList.toggle("tab-content--hidden", state.activeTab !== "apply");
  tabPresetsEl.classList.toggle("tab-content--hidden", state.activeTab !== "presets");
}
```

`renderStepper()` — 스텝 인디케이터 원형 + 라인 렌더링:

```js
export function renderStepper() {
  stepperEl.innerHTML = "";
  STEP_LABELS.forEach((label, i) => {
    const stepNum = i + 1;
    const isDone = stepNum < state.currentStep;
    const isActive = stepNum === state.currentStep;
    const canNavigate = stepNum < state.currentStep;

    if (i > 0) {
      const line = document.createElement("div");
      line.className = "stepper__line";
      if (isDone) line.classList.add("stepper__line--done");
      else if (isActive) line.classList.add("stepper__line--active");
      stepperEl.appendChild(line);
    }

    const step = document.createElement("div");
    step.className = "stepper__step";
    if (!canNavigate && !isActive) step.classList.add("stepper__step--disabled");

    const circle = document.createElement("div");
    circle.className = "stepper__circle";
    if (isDone) {
      circle.classList.add("stepper__circle--done");
      circle.textContent = "✓";
    } else if (isActive) {
      circle.classList.add("stepper__circle--active");
      circle.textContent = stepNum;
    } else {
      circle.textContent = stepNum;
    }

    const lbl = document.createElement("span");
    lbl.className = "stepper__label";
    lbl.textContent = label;

    step.appendChild(circle);
    step.appendChild(lbl);

    if (canNavigate) {
      step.addEventListener("click", () => emit("action:goToStep", stepNum));
    }

    stepperEl.appendChild(step);
  });
}
```

`renderStep()` — 현재 스텝만 표시하고, 이전/다음 버튼 활성화 상태 갱신:

```js
export function renderStep() {
  stepEls.forEach((el, i) => {
    el.classList.toggle("step--hidden", i + 1 !== state.currentStep);
  });
  // 다음 버튼 활성/비활성
  if (step1NextBtn) step1NextBtn.disabled = state.images.length === 0;
  if (step2NextBtn) step2NextBtn.disabled = state.entries.length === 0;

  renderStepper();
}
```

`initUI()` 수정 — 기존 구독에 탭/스텝 구독 추가:

```js
export function initUI() {
  on("entries", renderEntries);
  on("images", renderImages);
  on("presets", () => {
    renderPresetGroups();
    renderPresetValues();
  });
  on("tab", renderTabs);
  on("step", renderStep);
  // images/entries 변경 시 다음 버튼 상태도 갱신
  on("images", renderStep);
  on("entries", renderStep);

  renderTabs();
  renderStep();
  renderEntries();
  renderImages();
  renderPresetGroups();
  renderPresetValues();
}
```

- [ ] **Step 2: main.js에 탭/스텝 전환 로직 추가**

`main.js`의 `DOMContentLoaded` 내부에 추가:

```js
// Tab switching
document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.activeTab = btn.dataset.tab;
    emit("tab");
  });
});

// Step navigation buttons
document.getElementById("step1Next")?.addEventListener("click", () => {
  if (state.images.length > 0) {
    state.currentStep = 2;
    emit("step");
  }
});

document.getElementById("step2Prev")?.addEventListener("click", () => {
  state.currentStep = 1;
  emit("step");
});

document.getElementById("step2Next")?.addEventListener("click", () => {
  if (state.entries.length > 0) {
    state.currentStep = 3;
    emit("step");
  }
});

document.getElementById("step3Prev")?.addEventListener("click", () => {
  state.currentStep = 2;
  emit("step");
});

on("action:goToStep", (step) => {
  state.currentStep = step;
  emit("step");
});
```

`state`와 `emit`을 import에 추가 (이미 `on`은 import됨. `emit`도 추가):

```js
import { state, on, emit } from "./state.js";
```

- [ ] **Step 3: 브라우저에서 확인**

탭 전환, 스텝 이동이 동작하는지 확인. 이미지 없을 때 "다음" 비활성화 확인.

- [ ] **Step 4: Commit**

```bash
git add scripts/ui.js scripts/main.js
git commit -m "feat: implement tab switching and wizard step navigation"
```

---

### Task 3: Step 1 — 이미지 업로드 + 썸네일 그리드

**Files:**
- Modify: `scripts/ui.js`
- Modify: `scripts/main.js`

- [ ] **Step 1: ui.js에 renderThumbnails 함수 추가**

```js
const thumbnailGridEl = document.getElementById("thumbnailGrid");

export function renderThumbnails() {
  if (!thumbnailGridEl) return;
  thumbnailGridEl.innerHTML = "";
  state.images.forEach((image) => {
    const thumb = document.createElement("div");
    thumb.className = "thumbnail";

    const img = document.createElement("img");
    img.className = "thumbnail__img";
    img.src = image.dataUrl;
    img.alt = image.name;

    const name = document.createElement("span");
    name.className = "thumbnail__name";
    name.textContent = image.name;

    const removeBtn = document.createElement("button");
    removeBtn.className = "thumbnail__remove";
    removeBtn.textContent = "×";
    removeBtn.type = "button";
    removeBtn.addEventListener("click", () => emit("action:removeImage", image.id));

    thumb.appendChild(img);
    thumb.appendChild(name);
    thumb.appendChild(removeBtn);
    thumbnailGridEl.appendChild(thumb);
  });
}
```

`initUI()`에서 `on("images", renderThumbnails)` 추가, 초기 호출에도 `renderThumbnails()` 추가.

- [ ] **Step 2: main.js의 드래그&드롭/파일입력이 기존 로직 그대로 동작하는지 확인**

기존 `fileInput`, `dropZone` 이벤트 리스너는 이미 동작 중. ID가 동일하므로 변경 불필요.

- [ ] **Step 3: 브라우저에서 확인**

이미지 업로드 → 썸네일 표시 → × 클릭 삭제 → "다음" 버튼 활성화 확인.

- [ ] **Step 4: Commit**

```bash
git add scripts/ui.js
git commit -m "feat: add thumbnail grid for Step 1 upload"
```

---

### Task 4: Step 2 — 프리셋 카드 그리드 + 검색 필터

**Files:**
- Modify: `scripts/ui.js`
- Modify: `scripts/main.js`

- [ ] **Step 1: ui.js에 renderPresetCards 함수 추가**

```js
const presetCardGroupsEl = document.getElementById("presetCardGroups");
const presetSearchEl = document.getElementById("presetSearch");

export function renderPresetCards(filter = "") {
  if (!presetCardGroupsEl) return;
  presetCardGroupsEl.innerHTML = "";
  const query = filter.toLowerCase().trim();

  state.presets.groups.forEach((group) => {
    const section = document.createElement("div");
    section.className = "preset-card-group";

    const label = document.createElement("p");
    label.className = "preset-card-group__label";
    label.textContent = group.name;
    section.appendChild(label);

    const filtered = query
      ? group.values.filter((v) => v.label.toLowerCase().includes(query))
      : group.values;

    if (query && filtered.length === 0) {
      section.classList.add("preset-card-group--dim");
      const empty = document.createElement("p");
      empty.className = "preset-card-group__empty";
      empty.textContent = "일치하는 값 없음";
      section.appendChild(empty);
    } else {
      const cards = document.createElement("div");
      cards.className = "preset-card-group__cards";

      filtered.forEach((value) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "preset-card";
        card.textContent = value.label;

        // Check if this group's tag is already set in entries with this value
        const isSelected = state.entries.some(
          (e) => e.ifd === group.target.ifd &&
                 e.key === group.target.key &&
                 e.original === value.value
        );
        if (isSelected) card.classList.add("preset-card--selected");

        card.addEventListener("click", () => {
          emit("action:applyPresetValue", { groupId: group.id, valueId: value.id });
        });
        cards.appendChild(card);
      });
      section.appendChild(cards);
    }

    if (filtered.length > 0 || query) {
      const count = document.createElement("p");
      count.style.cssText = "font-size:11px;color:var(--muted);margin-top:6px;";
      if (query && filtered.length > 0) {
        count.textContent = `${group.values.length}개 중 ${filtered.length}개 표시`;
      }
      if (count.textContent) section.appendChild(count);
    }

    presetCardGroupsEl.appendChild(section);
  });
}
```

- [ ] **Step 2: 검색 input 이벤트를 main.js에 추가**

```js
const presetSearchInput = document.getElementById("presetSearch");
if (presetSearchInput) {
  presetSearchInput.addEventListener("input", () => {
    renderPresetCards(presetSearchInput.value);
  });
}
```

`renderPresetCards`를 ui.js에서 import 추가.

- [ ] **Step 3: initUI()에서 presets/entries 변경 시 카드 재렌더링 구독**

```js
on("presets", () => renderPresetCards(presetSearchEl?.value || ""));
on("entries", () => renderPresetCards(presetSearchEl?.value || ""));
```

초기 호출에 `renderPresetCards()` 추가.

- [ ] **Step 4: 브라우저에서 확인**

Step 2에서 프리셋 카드 표시, 검색 필터링, 카드 클릭 시 EXIF 엔트리에 추가 및 카드 선택 표시 확인.

- [ ] **Step 5: Commit**

```bash
git add scripts/ui.js scripts/main.js
git commit -m "feat: add preset card grid with search filter in Step 2"
```

---

### Task 5: Step 2 — 엔트리 칩 + 수동 태그

**Files:**
- Modify: `scripts/ui.js`

- [ ] **Step 1: ui.js에 renderEntryChips 함수 추가**

```js
const entryChipsEl = document.getElementById("entryChips");

export function renderEntryChips() {
  if (!entryChipsEl) return;
  entryChipsEl.innerHTML = "";

  if (state.entries.length === 0) {
    const empty = document.createElement("span");
    empty.className = "muted";
    empty.style.fontSize = "12px";
    empty.textContent = "설정된 EXIF 엔트리가 없습니다.";
    entryChipsEl.appendChild(empty);
    return;
  }

  const label = document.createElement("span");
  label.style.cssText = "font-size:12px;color:var(--muted);margin-right:4px;";
  label.textContent = `설정된 EXIF 엔트리 (${state.entries.length})`;
  entryChipsEl.appendChild(label);

  state.entries.forEach((entry) => {
    const chip = document.createElement("span");
    chip.className = "entry-chip";

    const text = document.createElement("span");
    const displayKey = entry.label || entry.keyHex;
    text.innerHTML = `<strong>${displayKey}</strong> = ${entry.original}`;

    const removeBtn = document.createElement("button");
    removeBtn.className = "entry-chip__remove";
    removeBtn.type = "button";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => emit("action:removeEntry", entry.id));

    chip.appendChild(text);
    chip.appendChild(removeBtn);
    entryChipsEl.appendChild(chip);
  });
}
```

`initUI()`에서 `on("entries", renderEntryChips)` 추가, 초기 호출에도 추가.

- [ ] **Step 2: 기존 entryForm submit은 이미 main.js에 있으므로 동작 확인**

기존 수동 태그 추가 로직(`entryForm` submit handler)은 `tagSelect`, `tagValue` 등의 ID가 유지되므로 그대로 동작.

- [ ] **Step 3: Commit**

```bash
git add scripts/ui.js
git commit -m "feat: add entry chips display in Step 2"
```

---

### Task 6: Step 3 — 적용 & 다운로드

**Files:**
- Modify: `scripts/ui.js`

- [ ] **Step 1: ui.js에 renderApplySummary 함수 추가**

```js
const applySummaryEl = document.getElementById("applySummary");
const applyEntryListEl = document.getElementById("applyEntryList");

export function renderApplySummary() {
  if (!applySummaryEl) return;
  applySummaryEl.innerHTML = "";

  const imgCard = document.createElement("div");
  imgCard.className = "apply-summary__card";
  imgCard.innerHTML = `<p class="apply-summary__label">이미지</p><p class="apply-summary__value">${state.images.length}장</p>`;

  const entryCard = document.createElement("div");
  entryCard.className = "apply-summary__card";
  entryCard.innerHTML = `<p class="apply-summary__label">EXIF 엔트리</p><p class="apply-summary__value">${state.entries.length}개</p>`;

  applySummaryEl.appendChild(imgCard);
  applySummaryEl.appendChild(entryCard);

  if (!applyEntryListEl) return;
  applyEntryListEl.innerHTML = "";

  state.entries.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "apply-entry-row";

    const left = document.createElement("span");
    const displayKey = entry.label || entry.keyHex;
    left.innerHTML = `<strong>${displayKey}</strong> <span style="color:var(--muted);font-size:11px;">[${entry.ifd}]</span>`;

    const right = document.createElement("span");
    right.style.color = "var(--muted)";
    right.textContent = entry.original;

    row.appendChild(left);
    row.appendChild(right);
    applyEntryListEl.appendChild(row);
  });
}
```

`initUI()`에서 `on("step", renderApplySummary)` 추가. Step 3 진입 시 요약을 갱신.

- [ ] **Step 2: renderImages()가 Step 3의 imageList에 렌더링 확인**

기존 `renderImages()`는 `id="imageList"` 에 렌더링하며, 이 요소는 Step 3에 위치. 그대로 동작.

- [ ] **Step 3: 브라우저에서 전체 플로우 확인**

업로드 → 프리셋 선택/수동 태그 → Step 3 요약 → EXIF 적용 → 다운로드 전체 흐름 테스트.

- [ ] **Step 4: Commit**

```bash
git add scripts/ui.js
git commit -m "feat: add apply summary and image grid in Step 3"
```

---

### Task 7: 프리셋 관리 탭 — 기존 CRUD 적용

**Files:**
- Modify: `scripts/ui.js`
- Modify: `scripts/main.js`

- [ ] **Step 1: 프리셋 관리 탭의 기존 기능이 동작하는지 확인**

HTML에서 `presetGroupForm`, `presetGroupName`, `presetGroupTag`, `activePresetGroup`, `presetValueForm`, `presetValueInput`, `presetGroupList`, `presetValueList`, `presetStatus`, `exportPresets`, `importPresetsInput` 등의 ID가 유지되어야 함.

기존 `renderPresetGroups()`, `renderPresetValues()` 및 main.js의 이벤트 핸들러가 그대로 동작해야 함.

- [ ] **Step 2: 프리셋 관리 탭에서 그룹 클릭 시 활성 그룹 전환**

기존 `renderPresetGroups()`에서 그룹 항목 클릭 시 `setActivePresetGroup` 호출하는 로직 추가 (현재는 Delete 버튼만 있음):

`renderPresetGroups()` 내에서 `item` 클릭 이벤트 추가:

```js
item.addEventListener("click", (e) => {
  if (e.target.closest("button")) return;
  emit("action:setActiveGroup", group.id);
});
```

main.js에 핸들러 추가:

```js
on("action:setActiveGroup", (groupId) => {
  setActivePresetGroup(groupId);
});
```

- [ ] **Step 3: 브라우저에서 프리셋 관리 탭 동작 확인**

그룹 추가/삭제, 값 추가/삭제, 그룹 전환, Export/Import 동작 확인.

- [ ] **Step 4: Commit**

```bash
git add scripts/ui.js scripts/main.js
git commit -m "feat: wire preset management tab with existing CRUD"
```

---

### Task 8: 프리셋 관리 — 이름 편집 + 순서 변경

**Files:**
- Modify: `scripts/presets.js`
- Modify: `scripts/ui.js`
- Modify: `scripts/main.js`

- [ ] **Step 1: presets.js에 rename/reorder 함수 추가**

```js
export function renameGroup(groupId, newName) {
  const group = state.presets.groups.find((g) => g.id === groupId);
  if (!group) return;
  const trimmed = newName.trim();
  if (!trimmed) return;
  group.name = trimmed;
  persistPresets();
}

export function renameValue(groupId, valueId, newLabel) {
  const group = state.presets.groups.find((g) => g.id === groupId);
  if (!group) return;
  const value = group.values.find((v) => v.id === valueId);
  if (!value) return;
  const trimmed = newLabel.trim();
  if (!trimmed) return;
  value.label = trimmed;
  value.value = trimmed;
  persistPresets();
}

export function reorderGroup(groupId, direction) {
  const idx = state.presets.groups.findIndex((g) => g.id === groupId);
  if (idx < 0) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= state.presets.groups.length) return;
  const temp = state.presets.groups[idx];
  state.presets.groups[idx] = state.presets.groups[newIdx];
  state.presets.groups[newIdx] = temp;
  persistPresets();
}

export function reorderValue(groupId, valueId, direction) {
  const group = state.presets.groups.find((g) => g.id === groupId);
  if (!group) return;
  const idx = group.values.findIndex((v) => v.id === valueId);
  if (idx < 0) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= group.values.length) return;
  const temp = group.values[idx];
  group.values[idx] = group.values[newIdx];
  group.values[newIdx] = temp;
  persistPresets();
}
```

- [ ] **Step 2: ui.js의 renderPresetGroups를 수정하여 편집/순서 버튼 추가**

기존 Delete 버튼 대신 `preset-item__actions` div에 ↑, ↓, ✎, 삭제 버튼 배치. ✎ 클릭 시 `<strong>` 을 `<input class="preset-item__edit-input">` 으로 교체하고, Enter/blur 시 `emit("action:renameGroup", { groupId, newName })` 발행.

```js
const actionsDiv = document.createElement("div");
actionsDiv.className = "preset-item__actions";

const upBtn = document.createElement("button");
upBtn.type = "button";
upBtn.className = "preset-item__btn";
upBtn.textContent = "↑";
upBtn.addEventListener("click", () => emit("action:reorderGroup", { groupId: group.id, direction: -1 }));

const downBtn = document.createElement("button");
downBtn.type = "button";
downBtn.className = "preset-item__btn";
downBtn.textContent = "↓";
downBtn.addEventListener("click", () => emit("action:reorderGroup", { groupId: group.id, direction: 1 }));

const editBtn = document.createElement("button");
editBtn.type = "button";
editBtn.className = "preset-item__btn";
editBtn.textContent = "✎";
editBtn.addEventListener("click", () => {
  name.replaceWith(editInput);
  const editInput = document.createElement("input");
  editInput.className = "preset-item__edit-input";
  editInput.value = group.name;
  name.replaceWith(editInput);
  editInput.focus();
  const commit = () => emit("action:renameGroup", { groupId: group.id, newName: editInput.value });
  editInput.addEventListener("blur", commit);
  editInput.addEventListener("keydown", (e) => { if (e.key === "Enter") editInput.blur(); });
});

const deleteBtn = document.createElement("button");
deleteBtn.type = "button";
deleteBtn.className = "preset-item__btn preset-item__btn--danger";
deleteBtn.textContent = "삭제";
deleteBtn.addEventListener("click", () => emit("action:removePresetGroup", group.id));

actionsDiv.append(upBtn, downBtn, editBtn, deleteBtn);
```

`renderPresetValues()`에도 동일한 패턴으로 ↑↓✎삭제 추가 (Apply 버튼은 제거 — 프리셋 관리 탭에서는 Apply 불필요, Step 2의 카드 클릭이 그 역할).

- [ ] **Step 3: main.js에 action 핸들러 추가**

```js
import { renameGroup, renameValue, reorderGroup, reorderValue } from "./presets.js";

on("action:renameGroup", ({ groupId, newName }) => renameGroup(groupId, newName));
on("action:renameValue", ({ groupId, valueId, newLabel }) => renameValue(groupId, valueId, newLabel));
on("action:reorderGroup", ({ groupId, direction }) => reorderGroup(groupId, direction));
on("action:reorderValue", ({ groupId, valueId, direction }) => reorderValue(groupId, valueId, direction));
```

- [ ] **Step 4: 브라우저에서 확인**

프리셋 관리 탭에서 그룹/값의 이름 편집 (인라인 input), 순서 변경 (↑↓), 삭제 동작 확인.

- [ ] **Step 5: Commit**

```bash
git add scripts/presets.js scripts/ui.js scripts/main.js
git commit -m "feat: add rename and reorder for preset groups and values"
```

---

### Task 9: JSON Merge 기능

**Files:**
- Modify: `scripts/presets.js`
- Modify: `scripts/ui.js`
- Modify: `scripts/main.js`

- [ ] **Step 1: presets.js에 mergePresets 함수 추가**

`selections`는 `{ groupId: string, valueIds: string[] }[]` 형태. 각 항목은 가져온 JSON에서 선택된 그룹과 값을 나타냄.

```js
export function mergePresets(incoming, selections) {
  const incomingNorm = normalizePresets(incoming);

  selections.forEach(({ groupId, valueIds }) => {
    const srcGroup = incomingNorm.groups.find((g) => g.id === groupId);
    if (!srcGroup) return;

    // Find matching existing group by ifd+key
    const existingGroup = state.presets.groups.find(
      (g) => g.target.ifd === srcGroup.target.ifd && g.target.key === srcGroup.target.key
    );

    if (existingGroup) {
      // Add selected values that don't already exist
      valueIds.forEach((vid) => {
        const srcValue = srcGroup.values.find((v) => v.id === vid);
        if (!srcValue) return;
        const duplicate = existingGroup.values.some(
          (v) => v.value.toLowerCase() === srcValue.value.toLowerCase()
        );
        if (!duplicate) {
          existingGroup.values.push({
            id: generateId("value"),
            label: srcValue.label,
            value: srcValue.value,
          });
        }
      });
    } else {
      // Add new group with selected values only
      const selectedValues = valueIds
        .map((vid) => srcGroup.values.find((v) => v.id === vid))
        .filter(Boolean)
        .map((v) => ({ id: generateId("value"), label: v.label, value: v.value }));

      if (selectedValues.length > 0) {
        state.presets.groups.push({
          id: generateId("group"),
          name: srcGroup.name,
          target: { ...srcGroup.target },
          values: selectedValues,
        });
      }
    }
  });

  persistPresets();
}
```

`normalizePresets`와 `generateId`는 이미 모듈 내부에 존재하므로 접근 가능.

- [ ] **Step 2: ui.js에 merge 모달 렌더링 함수 추가**

```js
const mergeOverlayEl = document.getElementById("mergeOverlay");
const mergeContentEl = document.getElementById("mergeContent");
const mergeSummaryEl = document.getElementById("mergeSummary");

let mergeState = null; // { incoming, selections }

export function showMergeModal(incomingPresets) {
  // Normalize incoming to get consistent structure
  // Store in module-level mergeState for checkbox interactions
  mergeState = {
    incoming: incomingPresets,
    selections: new Map(), // groupId -> Set of valueIds
  };

  renderMergeContent();
  mergeOverlayEl.classList.add("modal-overlay--visible");
}

export function hideMergeModal() {
  mergeOverlayEl?.classList.remove("modal-overlay--visible");
  mergeState = null;
}

export function getMergeSelections() {
  if (!mergeState) return [];
  return Array.from(mergeState.selections.entries()).map(([groupId, valueIds]) => ({
    groupId,
    valueIds: Array.from(valueIds),
  }));
}

function renderMergeContent() {
  if (!mergeContentEl || !mergeState) return;
  mergeContentEl.innerHTML = "";

  const incoming = mergeState.incoming;

  incoming.groups.forEach((group) => {
    const existingGroup = state.presets.groups.find(
      (g) => g.target.ifd === group.target.ifd && g.target.key === group.target.key
    );
    const isNewGroup = !existingGroup;

    // Initialize selections: new values checked, existing unchecked
    if (!mergeState.selections.has(group.id)) {
      const autoSelected = new Set();
      group.values.forEach((v) => {
        const exists = existingGroup?.values.some(
          (ev) => ev.value.toLowerCase() === v.value.toLowerCase()
        );
        if (!exists) autoSelected.add(v.id);
      });
      mergeState.selections.set(group.id, autoSelected);
    }
    const selectedIds = mergeState.selections.get(group.id);

    const groupDiv = document.createElement("div");
    groupDiv.className = "merge-group";

    // Group header with checkbox
    const header = document.createElement("div");
    header.className = "merge-group__header";

    const groupCb = document.createElement("input");
    groupCb.type = "checkbox";
    groupCb.checked = selectedIds.size > 0;
    groupCb.addEventListener("change", () => {
      if (groupCb.checked) {
        group.values.forEach((v) => selectedIds.add(v.id));
      } else {
        selectedIds.clear();
      }
      renderMergeContent();
    });

    const headerText = document.createElement("div");
    headerText.innerHTML = `<strong>${group.name}</strong>
      <span style="font-size:11px;color:var(--muted);margin-left:6px;">${group.target.label || ""} · ${group.target.ifd}</span>`;

    const badge = document.createElement("span");
    badge.className = isNewGroup ? "merge-label merge-label--new" : "merge-label merge-label--exists";
    badge.textContent = isNewGroup ? "새 그룹" : "이미 존재";

    header.appendChild(groupCb);
    header.appendChild(headerText);
    header.appendChild(badge);

    // Values list
    const valuesDiv = document.createElement("div");
    valuesDiv.className = "merge-group__values";

    group.values.forEach((value) => {
      const exists = existingGroup?.values.some(
        (ev) => ev.value.toLowerCase() === value.value.toLowerCase()
      );

      const row = document.createElement("div");
      row.className = "merge-value";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = selectedIds.has(value.id);
      cb.addEventListener("change", () => {
        if (cb.checked) selectedIds.add(value.id);
        else selectedIds.delete(value.id);
        updateMergeSummary();
      });

      const label = document.createElement("span");
      label.style.fontSize = "13px";
      label.textContent = value.label;

      const tag = document.createElement("span");
      tag.className = exists ? "merge-label merge-label--exists" : "merge-label merge-label--new";
      tag.textContent = exists ? "이미 존재" : "새 항목";

      row.appendChild(cb);
      row.appendChild(label);
      row.appendChild(tag);
      valuesDiv.appendChild(row);
    });

    groupDiv.appendChild(header);
    groupDiv.appendChild(valuesDiv);
    mergeContentEl.appendChild(groupDiv);
  });

  updateMergeSummary();
}

function updateMergeSummary() {
  if (!mergeSummaryEl || !mergeState) return;
  let totalValues = 0;
  let newGroups = 0;

  mergeState.selections.forEach((valueIds, groupId) => {
    if (valueIds.size === 0) return;
    totalValues += valueIds.size;
    const srcGroup = mergeState.incoming.groups.find((g) => g.id === groupId);
    if (!srcGroup) return;
    const exists = state.presets.groups.some(
      (g) => g.target.ifd === srcGroup.target.ifd && g.target.key === srcGroup.target.key
    );
    if (!exists) newGroups++;
  });

  const parts = [`${totalValues}개 값 가져오기`];
  if (newGroups > 0) parts.push(`${newGroups}개 새 그룹`);
  mergeSummaryEl.textContent = totalValues > 0 ? parts.join(" · ") : "선택된 항목 없음";
}
```

- [ ] **Step 3: main.js에 merge 이벤트 핸들링 추가**

```js
import { mergePresets } from "./presets.js";
import { showMergeModal, hideMergeModal, getMergeSelections } from "./ui.js";

const mergePresetsInput = document.getElementById("mergePresetsInput");

mergePresetsInput?.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    showMergeModal(normalizePresets(parsed));
  } catch (error) {
    updatePresetStatus(`Merge 파일 로드 실패: ${error.message}`, "error");
  } finally {
    mergePresetsInput.value = "";
  }
});
```

`normalizePresets`는 `presets.js`에서 export 필요 — export 추가:

```js
// presets.js 수정: normalizePresets를 export
export function normalizePresets(raw) { ... }
```

Merge 모달의 확인/취소/닫기 버튼 핸들링:

```js
document.getElementById("mergeConfirm")?.addEventListener("click", () => {
  const selections = getMergeSelections();
  if (selections.length === 0) return;
  mergePresets(/* incoming from mergeState */, selections);
  hideMergeModal();
  updatePresetStatus("프리셋이 병합되었습니다.", "success");
});

document.getElementById("mergeCancel")?.addEventListener("click", hideMergeModal);
document.getElementById("mergeClose")?.addEventListener("click", hideMergeModal);

mergeOverlayEl?.addEventListener("click", (e) => {
  if (e.target === mergeOverlayEl) hideMergeModal();
});
```

Merge 실행에 incoming 데이터가 필요하므로 `getMergeIncoming()` 도 ui.js에서 export:

```js
export function getMergeIncoming() {
  return mergeState?.incoming || null;
}
```

main.js의 mergeConfirm:

```js
document.getElementById("mergeConfirm")?.addEventListener("click", () => {
  const incoming = getMergeIncoming();
  const selections = getMergeSelections();
  if (!incoming || selections.length === 0) return;
  mergePresets(incoming, selections);
  hideMergeModal();
  updatePresetStatus("프리셋이 병합되었습니다.", "success");
});
```

- [ ] **Step 4: presets.js에서 normalizePresets를 export로 변경**

`function normalizePresets` → `export function normalizePresets`

- [ ] **Step 5: 브라우저에서 확인**

프리셋 관리 탭에서 Merge 버튼 → JSON 파일 선택 → 모달에 그룹/값 체크박스 표시 → 선택적 Merge → 프리셋 목록에 반영 확인.

- [ ] **Step 6: Commit**

```bash
git add scripts/presets.js scripts/ui.js scripts/main.js
git commit -m "feat: add JSON merge with selective import modal"
```

---

### Task 10: 정리 + CLAUDE.md 업데이트

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 기존 ui.js에서 사용하지 않는 렌더 함수 정리**

기존 `renderEntries()`는 Step 2의 칩과 Step 3의 엔트리 목록에서 대체됨. 더 이상 `entryItemsEl`을 사용하지 않으면 제거. 단, 프리셋 관리 탭에서 여전히 사용되는 함수는 유지.

사용 여부를 grep으로 확인 후 미사용 함수/변수 제거.

- [ ] **Step 2: CLAUDE.md 아키텍처 섹션 업데이트**

탭+위자드 구조, `state.activeTab`/`state.currentStep`, 이벤트 이름 (`tab`, `step`, `action:*`), merge 기능에 대한 설명 추가.

- [ ] **Step 3: 전체 플로우 최종 확인**

전체 시나리오 수동 테스트:
1. EXIF 적용 탭 → Step 1 이미지 업로드 → 다음
2. Step 2 검색/프리셋 선택 + 수동 태그 → 다음
3. Step 3 요약 확인 → EXIF 적용 → 다운로드
4. 프리셋 관리 탭 → 그룹/값 CRUD, 이름 편집, 순서 변경
5. Export → Import → Merge

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md scripts/ui.js
git commit -m "chore: clean up unused code and update CLAUDE.md"
```
