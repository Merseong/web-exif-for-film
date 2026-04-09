# UI/UX 구조 개선 설계

## 목표

현재 단일 페이지에 4개 패널이 나열된 구조를 **2개 탭(EXIF 적용 / 프리셋 관리)** 으로 분리하고, EXIF 적용 흐름을 **3단계 위자드**로 전환하여 단계별로 필요한 UI만 표시한다.

## 구조

```
┌─────────────────────────────────────┐
│  [EXIF 적용]  [프리셋 관리]         │  ← 탭 네비게이션
├─────────────────────────────────────┤
│                                     │
│         활성 탭의 콘텐츠              │
│                                     │
└─────────────────────────────────────┘
```

---

## 탭 1: EXIF 적용 (3단계 위자드)

수평 스텝 인디케이터 (① ② ③) 로 진행 상태를 표시하고, 현재 단계의 콘텐츠만 렌더링한다.

### Step 1: 이미지 업로드

- 드래그 & 드롭 영역 + 파일 선택 버튼
- 업로드된 이미지를 작은 썸네일 그리드로 미리보기 (파일명, × 버튼으로 개별 삭제)
- 이미지 1장 이상 업로드 시 "다음" 버튼 활성화
- 0장이면 "다음" 버튼 비활성화

### Step 2: EXIF 설정

두 영역으로 구성:

**프리셋 선택 (상단)**
- 검색 input이 최상단에 위치. 입력 시 모든 그룹의 값을 실시간 필터링
- 프리셋 그룹별로 섹션이 나뉘고, 각 그룹 아래에 값들이 클릭 가능한 카드/버튼으로 나열
- 카드 클릭 → 해당 그룹의 EXIF 태그가 pending 엔트리에 upsert (`setEntry` 동작)
- 선택된 카드는 시각적으로 강조 (border 색상 변경)
- 검색 결과가 없는 그룹은 흐리게(opacity) 처리하되 숨기지는 않음

**수동 태그 추가 (하단, 점선 구분선 아래)**
- 기존과 동일: Tag 드롭다운 + Value input + 추가 버튼
- `addEntry`로 pending 엔트리에 추가

**설정된 EXIF 엔트리 요약 (최하단)**
- 현재 pending 엔트리를 칩(chip) 형태로 나열 (태그명 = 값, × 삭제)
- 엔트리 1개 이상 시 "다음" 버튼 활성화

### Step 3: 적용 & 다운로드

- 요약 카드: 이미지 수, EXIF 엔트리 수
- 엔트리 목록 (태그명, IFD, 값)
- "EXIF 적용" 버튼 → `applyExifToImages()` 실행, 로딩 오버레이 표시
- 적용 완료 후 이미지 그리드 표시 (썸네일 + 개별 다운로드 링크)
- "전체 다운로드" 버튼
- "이전" 버튼으로 Step 2 복귀 가능

### 위자드 네비게이션 규칙

- 이전/다음 버튼으로 단계 이동
- 스텝 인디케이터의 완료된 단계(✓) 클릭으로도 해당 단계로 이동 가능
- 현재 단계보다 앞선 미완료 단계로는 이동 불가
- Step 1 → Step 2 전환 조건: `state.images.length > 0`
- Step 2 → Step 3 전환 조건: `state.entries.length > 0`

---

## 탭 2: 프리셋 관리

### 헤더

탭 바 바로 아래에 "프리셋 관리" 제목 + JSON Export / JSON Import / Merge 버튼 3개를 한 줄에 배치.

### 그룹/값 2열 레이아웃

기존 구조를 유지하되 아래 기능 추가:

**그룹 (좌측 열)**
- 그룹 추가 폼 (이름 + EXIF 태그 드롭다운)
- 그룹 목록: 각 항목에 이름, 매핑 태그 정보, 그리고 순서 변경(↑↓) / 이름 편집(✎) / 삭제 버튼
- 활성 그룹은 강조 표시, 클릭으로 활성 그룹 전환

**값 (우측 열)**
- 활성 그룹의 값 목록 표시
- 값 추가 input
- 각 값 항목에 순서 변경(↑↓) / 이름 편집(✎) / 삭제 버튼

### 이름 편집

그룹 이름 또는 값을 편집할 때, 해당 항목이 inline input으로 전환되고 Enter 또는 blur로 확정.

### 순서 변경

↑↓ 버튼으로 그룹/값의 배열 내 위치를 한 칸씩 이동. 변경 즉시 `persistPresets()` 호출.

### JSON Export

기존과 동일. `state.presets`를 JSON으로 직렬화하여 파일 다운로드.

### JSON Import

기존과 동일. JSON 파일을 파싱하여 `state.presets`를 완전히 교체.

### JSON Merge (신규)

1. "Merge" 버튼 클릭 → 파일 선택 다이얼로그
2. JSON 파일 로드 후 모달 표시
3. 모달 내용:
   - 가져온 JSON의 그룹 목록을 표시
   - 각 그룹 옆에 체크박스 (체크 → 하위 값 전체 선택/해제)
   - 각 값 옆에 개별 체크박스
   - 내 프리셋에 이미 존재하는 그룹은 "이미 존재" 라벨, 새 그룹은 "새 그룹" 라벨
   - 내 프리셋에 이미 존재하는 값은 "이미 존재" 라벨 + 기본 체크 해제, 새 값은 "새 항목" 라벨 + 기본 체크
4. 하단에 선택 요약 (N개 값 가져오기, M개 새 그룹) + 취소/Merge 버튼
5. Merge 실행 시:
   - 새 그룹: 그대로 추가
   - 기존 그룹에 새 값: 해당 그룹의 values 배열 끝에 추가
   - 이미 존재하는 값을 체크한 경우: 덮어쓰지 않고 스킵 (중복 방지)
6. Merge 완료 후 모달 닫기, `persistPresets()` 호출

### Merge 중복 판정 기준

- 그룹: `target.ifd`와 `target.key`가 같으면 동일 그룹으로 판정 (이름이 달라도)
- 값: 같은 그룹 내에서 `value` 문자열의 대소문자 무시 비교

---

## 상태 관리

기존 이벤트 버스 패턴(`on`/`emit`)을 그대로 활용:

- 위자드 현재 단계: `state.currentStep` (1, 2, 3) 추가
- 활성 탭: `state.activeTab` ("apply", "presets") 추가
- 탭/단계 변경 시 `emit("tab")` / `emit("step")` → UI 자동 렌더링

프리셋 검색어는 상태에 저장하지 않고 UI 내부에서 로컬로 관리 (검색어는 일시적).

---

## HTML 구조

`index.html`의 `<main>` 내부를 다음과 같이 재구성:

```html
<nav class="tabs">
  <button class="tab tab--active" data-tab="apply">EXIF 적용</button>
  <button class="tab" data-tab="presets">프리셋 관리</button>
</nav>

<div id="tabApply" class="tab-content">
  <div class="stepper">...</div>
  <div id="step1" class="step">...</div>
  <div id="step2" class="step step--hidden">...</div>
  <div id="step3" class="step step--hidden">...</div>
</div>

<div id="tabPresets" class="tab-content tab-content--hidden">
  ...
</div>
```

기존 hero 헤더는 간소화하거나 탭 네비게이션으로 대체.

---

## 파일 변경 범위

- **`index.html`** — HTML 전면 재구성 (탭, 위자드 단계, 프리셋 관리 레이아웃, merge 모달)
- **`css/style.css`** — 탭, 스텝 인디케이터, 카드 그리드, 모달, 검색 input 스타일 추가
- **`scripts/state.js`** — `activeTab`, `currentStep` 필드 추가
- **`scripts/main.js`** — 탭/위자드 전환 로직, merge 모달 이벤트 핸들링
- **`scripts/presets.js`** — `mergePresets()`, `reorderGroup()`, `reorderValue()`, `renameGroup()`, `renameValue()` 함수 추가
- **`scripts/ui.js`** — 탭 렌더링, 위자드 스텝 렌더링, 프리셋 카드 그리드, 검색 필터, merge 모달 렌더링 함수 추가/변경
- **`scripts/exifEditor.js`** — 변경 없음
- **`scripts/fileHandler.js`** — 변경 없음
