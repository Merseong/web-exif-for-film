const STORAGE_KEY = "exifEditorLang";

const translations = {
  ko: {
    // Page
    "page.title": "EXIF 일괄 편집기",
    "hero.title": "EXIF 일괄 편집기",
    "hero.subtitle": "JPEG 파일을 업로드하고, EXIF 태그를 설정하고, 일괄 적용하세요. 모든 작업은 브라우저에서 실행됩니다.",

    // Tabs
    "tab.apply": "EXIF 적용",
    "tab.presets": "프리셋 관리",

    // Step labels
    "step.upload": "업로드",
    "step.exif": "EXIF 설정",
    "step.apply": "적용 & 다운로드",

    // Step 1
    "step1.eyebrow": "Step 1",
    "step1.title": "이미지 업로드",
    "step1.desc": "편집할 JPEG 파일을 선택하세요.",
    "step1.choose": "이미지 선택",
    "step1.dropTitle": "JPEG 파일을 드래그하거나 클릭",
    "step1.dropSubtitle": "여러 파일을 한 번에 업로드할 수 있습니다",
    "step1.clear": "전체 삭제",
    "btn.next": "다음 →",
    "btn.prev": "← 이전",

    // Step 2
    "step2.presetLabel": "프리셋 선택",
    "step2.searchPlaceholder": "프리셋 검색...",
    "step2.manualLabel": "수동 태그 추가",
    "step2.tagLabel": "Tag (IFD0 또는 ExifIFD)",
    "step2.valueLabel": "값",
    "step2.valuePlaceholder": "e.g., Canon Demi EE17",
    "step2.add": "추가",
    "step2.pendingLabel": "설정된 EXIF 엔트리",

    // Step 3
    "step3.applyExif": "EXIF 적용",
    "step3.downloadAll": "전체 다운로드",
    "summary.images": "이미지",
    "summary.entries": "EXIF 엔트리",
    "unit.images": "장",
    "unit.entries": "개",

    // Preset management
    "preset.title": "프리셋 관리",
    "preset.hardClear": "전체 비우기",
    "preset.resetDefault": "기본값 복원",
    "preset.mergeDefault": "기본값 Merge",
    "preset.export": "Export",
    "preset.import": "Import",
    "preset.merge": "Merge",
    "preset.groups": "그룹",
    "preset.groupsDesc": "그룹 이름을 입력하고 EXIF 태그를 연결하세요.",
    "preset.groupName": "그룹 이름",
    "preset.groupNamePlaceholder": "e.g., Film, Camera, Lens",
    "preset.tagMapping": "EXIF 태그 매핑",
    "preset.addGroup": "그룹 추가",
    "preset.values": "값 목록",
    "preset.valuesDesc": "활성 그룹을 선택하고 프리셋 값을 추가하세요.",
    "preset.activeGroup": "활성 그룹",
    "preset.valuePlaceholder": "e.g., kodak_ultramax_400",
    "preset.addValue": "값 추가",

    // Merge modal
    "merge.title": "프리셋 Merge",
    "merge.desc": "가져올 그룹과 값을 선택하세요.",
    "merge.cancel": "취소",
    "merge.confirm": "Merge 실행",
    "merge.close": "닫기",

    // Actions
    "action.remove": "삭제",
    "action.edit": "편집",
    "action.download": "다운로드",
    "action.removeFromList": "목록에서 제거",

    // Status messages
    "status.imageCleared": "모든 이미지가 삭제되었습니다.",
    "status.entryAdded": "EXIF 엔트리가 추가되었습니다.",
    "status.entriesCleared": "모든 EXIF 엔트리가 삭제되었습니다.",
    "status.applyingExif": "EXIF 적용 중...",
    "status.noImages": "이미지를 먼저 업로드하세요.",
    "status.noDownload": "다운로드할 이미지가 없습니다. 업로드 후 EXIF를 적용하세요.",
    "status.downloadStarted": "다운로드를 시작합니다.",
    "status.zipLoading": "ZIP 라이브러리 로딩 중. 잠시 후 다시 시도하세요.",
    "status.zipCreating": "ZIP 파일 생성 중...",
    "status.zipDownload": "{count}장을 ZIP으로 다운로드합니다.",
    "status.zipFailed": "ZIP 생성 실패: {error}",
    "status.loadingImages": "이미지 로딩 중...",
    "status.groupAdded": "그룹이 추가되었습니다.",
    "status.groupRemoved": "그룹이 삭제되었습니다.",
    "status.valueAdded": "값이 추가되었습니다.",
    "status.valueRemoved": "그룹에서 값이 삭제되었습니다.",
    "status.presetNotFound": "프리셋 값을 찾을 수 없습니다.",
    "status.presetApplied": "{group} 프리셋이 {tag}에 적용되었습니다.",
    "status.presetAppliedHint": "프리셋이 적용되었습니다. EXIF 적용 버튼을 클릭하세요.",
    "status.createGroupFirst": "먼저 그룹을 생성하세요.",
    "status.exported": "프리셋 JSON이 내보내졌습니다.",
    "status.imported": "{file}에서 프리셋을 가져왔습니다.",
    "status.importFailed": "가져오기 실패: {error}",
    "status.mergeFailed": "Merge 파일 로드 실패: {error}",
    "status.merged": "프리셋이 병합되었습니다.",
    "status.hardCleared": "모든 프리셋이 삭제되었습니다.",
    "status.resetDone": "기본 프리셋으로 복원되었습니다.",

    // Confirm dialogs
    "confirm.hardClear": "모든 프리셋을 삭제합니다. 계속하시겠습니까?",
    "confirm.resetDefault": "기본 프리셋으로 복원합니다. 현재 프리셋은 사라집니다. 계속하시겠습니까?",

    // Empty states
    "empty.noEntries": "설정된 EXIF 엔트리가 없습니다.",
    "empty.noEntriesYet": "EXIF 엔트리가 아직 없습니다.",
    "empty.noImages": "로드된 이미지가 없습니다.",
    "empty.noExif": "EXIF 데이터가 없습니다.",
    "empty.noGroups": "그룹을 추가하여 프리셋을 만드세요.",
    "empty.noGroupsOption": "그룹 없음",
    "empty.selectGroup": "그룹을 선택하세요.",
    "empty.noValues": "저장된 값이 없습니다. 아래에서 추가하세요.",
    "empty.noMatch": "일치하는 값 없음",
    "empty.selectedNone": "선택된 항목 없음",

    // Counts
    "count.entriesLabel": "설정된 EXIF 엔트리 ({count})",
    "count.filtered": "{total}개 중 {match}개 표시",
    "count.mergeSelected": "{count}개 값 선택됨",
    "count.mergeNewGroups": "새 그룹 {count}개 포함",

    // Merge labels
    "merge.existsGroup": "이미 존재",
    "merge.newGroup": "새 그룹",
    "merge.existsValue": "이미 존재",
    "merge.newValue": "새 항목",

    // Loading
    "loading.working": "처리 중...",
    "loading.selectedImage": "선택된 이미지",

    // Theme
    "theme.system": "시스템 기본",
    "theme.dark": "다크",
    "theme.light": "라이트",

    // Update
    "update.available": "{version} 업데이트가 있습니다",
    "update.download": "다운로드",
    "update.newVersion": "→ {version} 새 버전",

    // Film
    "film.label": "필름",
    "film.targetTag": "이름 태그",
    "film.name": "필름 이름",
    "film.namePlaceholder": "e.g., kodak_portra_400",
    "film.apply": "적용",
    "film.selected": "{name} 선택됨 (ISO를 수정할 수 있습니다)",
    "film.applied": "{name} 필름이 적용되었습니다. (ISO: {iso})",
    "film.added": "필름이 추가되었습니다.",
    "film.removed": "필름이 삭제되었습니다.",
    "film.resetDone": "필름 프리셋이 초기화되었습니다.",
    "film.empty": "등록된 필름이 없습니다.",
    "film.isoOverride": "ISO 변경",
    "film.applyIso": "ISO 적용",
    "film.isoUpdated": "ISO가 {iso}(으)로 변경되었습니다.",
    "film.searchPlaceholder": "필름 검색...",
    "film.pageInfo": "{current} / {total} 페이지",
  },

  en: {
    "page.title": "EXIF Batch Editor",
    "hero.title": "EXIF Batch Editor",
    "hero.subtitle": "Upload JPEG files, configure EXIF tags, and apply them in bulk. Everything runs in the browser.",

    "tab.apply": "Apply EXIF",
    "tab.presets": "Manage Presets",

    "step.upload": "Upload",
    "step.exif": "EXIF Settings",
    "step.apply": "Apply & Download",

    "step1.eyebrow": "Step 1",
    "step1.title": "Upload images",
    "step1.desc": "Select the JPEG files you want to edit.",
    "step1.choose": "Choose images",
    "step1.dropTitle": "Drag & drop JPEGs here",
    "step1.dropSubtitle": "or click to browse",
    "step1.clear": "Clear all",
    "btn.next": "Next →",
    "btn.prev": "← Back",

    "step2.presetLabel": "Preset quick-pick",
    "step2.searchPlaceholder": "Search presets...",
    "step2.manualLabel": "Manual tag entry",
    "step2.tagLabel": "Tag (IFD0 or ExifIFD)",
    "step2.valueLabel": "Value",
    "step2.valuePlaceholder": "e.g., Olympus mju",
    "step2.add": "Add",
    "step2.pendingLabel": "Pending EXIF entries",

    "step3.applyExif": "Apply EXIF",
    "step3.downloadAll": "Download all",
    "summary.images": "Images",
    "summary.entries": "EXIF Entries",
    "unit.images": "",
    "unit.entries": "",

    "preset.title": "Manage Presets",
    "preset.hardClear": "Clear all",
    "preset.resetDefault": "Reset to default",
    "preset.mergeDefault": "Merge default",
    "preset.export": "Export",
    "preset.import": "Import",
    "preset.merge": "Merge",
    "preset.groups": "Groups",
    "preset.groupsDesc": "Name the group and link it to an EXIF tag.",
    "preset.groupName": "Group name",
    "preset.groupNamePlaceholder": "e.g., Film, Camera, Lens",
    "preset.tagMapping": "EXIF tag mapping",
    "preset.addGroup": "Add group",
    "preset.values": "Values",
    "preset.valuesDesc": "Choose the active group and add presets. Applying a value sets the mapped EXIF tag.",
    "preset.activeGroup": "Active group",
    "preset.valuePlaceholder": "e.g., kodak_ultramax_400",
    "preset.addValue": "Add value",

    "merge.title": "Merge Presets",
    "merge.desc": "Select groups and values to import.",
    "merge.cancel": "Cancel",
    "merge.confirm": "Confirm merge",
    "merge.close": "Close",

    "action.remove": "Delete",
    "action.edit": "Edit",
    "action.download": "Download",
    "action.removeFromList": "Remove from list",

    "status.imageCleared": "All images cleared.",
    "status.entryAdded": "EXIF entry added.",
    "status.entriesCleared": "All EXIF entries cleared.",
    "status.applyingExif": "Applying EXIF to images...",
    "status.noImages": "Please upload at least one image.",
    "status.noDownload": "No images to download. Upload and apply EXIF first.",
    "status.downloadStarted": "Download started.",
    "status.zipLoading": "ZIP library not loaded. Try again shortly.",
    "status.zipCreating": "Creating ZIP file...",
    "status.zipDownload": "Downloading {count} images as ZIP.",
    "status.zipFailed": "ZIP creation failed: {error}",
    "status.loadingImages": "Loading images...",
    "status.groupAdded": "Group added.",
    "status.groupRemoved": "Group removed.",
    "status.valueAdded": "Value added to the group.",
    "status.valueRemoved": "Value removed from the group.",
    "status.presetNotFound": "Could not find that preset value.",
    "status.presetApplied": "Applied {group} preset to {tag}.",
    "status.presetAppliedHint": "Preset applied. Click Apply EXIF to write it to your images.",
    "status.createGroupFirst": "Create a group before adding values.",
    "status.exported": "Preset JSON exported.",
    "status.imported": "Imported presets from {file}.",
    "status.importFailed": "Import failed: {error}",
    "status.mergeFailed": "Merge file load failed: {error}",
    "status.merged": "Presets merged successfully.",
    "status.hardCleared": "All presets cleared.",
    "status.resetDone": "Reset to default presets.",

    "confirm.hardClear": "This will delete all presets. Continue?",
    "confirm.resetDefault": "This will restore default presets. Current presets will be lost. Continue?",

    "empty.noEntries": "No EXIF entries configured.",
    "empty.noEntriesYet": "No EXIF entries yet.",
    "empty.noImages": "No images loaded yet.",
    "empty.noExif": "No EXIF entries found.",
    "empty.noGroups": "Add a group to start building presets.",
    "empty.noGroupsOption": "No groups yet",
    "empty.selectGroup": "Select a group to view its values.",
    "empty.noValues": "No saved values yet. Add one below.",
    "empty.noMatch": "No matching values",
    "empty.selectedNone": "Nothing selected",

    "count.entriesLabel": "Pending EXIF entries ({count})",
    "count.filtered": "Showing {match} of {total}",
    "count.mergeSelected": "{count} values selected",
    "count.mergeNewGroups": "including {count} new groups",

    "merge.existsGroup": "Exists",
    "merge.newGroup": "New group",
    "merge.existsValue": "Exists",
    "merge.newValue": "New",

    "loading.working": "Working...",
    "loading.selectedImage": "Selected image",

    "theme.system": "System",
    "theme.dark": "Dark",
    "theme.light": "Light",

    "update.available": "{version} update available",
    "update.download": "Download",
    "update.newVersion": "→ {version} new version",

    "film.label": "Film",
    "film.targetTag": "Name tag",
    "film.name": "Film name",
    "film.namePlaceholder": "e.g., kodak_portra_400",
    "film.apply": "Apply",
    "film.selected": "{name} selected (you can adjust the ISO)",
    "film.applied": "Film {name} applied. (ISO: {iso})",
    "film.added": "Film added.",
    "film.removed": "Film removed.",
    "film.resetDone": "Film presets reset to default.",
    "film.empty": "No films registered.",
    "film.isoOverride": "Override ISO",
    "film.applyIso": "Apply ISO",
    "film.isoUpdated": "ISO changed to {iso}.",
    "film.searchPlaceholder": "Search films...",
    "film.pageInfo": "Page {current} / {total}",
  },

  ja: {
    "page.title": "EXIF 一括編集",
    "hero.title": "EXIF 一括編集",
    "hero.subtitle": "JPEGファイルをアップロードし、EXIFタグを設定して一括適用します。すべてブラウザ上で動作します。",

    "tab.apply": "EXIF 適用",
    "tab.presets": "プリセット管理",

    "step.upload": "アップロード",
    "step.exif": "EXIF 設定",
    "step.apply": "適用 & ダウンロード",

    "step1.eyebrow": "Step 1",
    "step1.title": "画像アップロード",
    "step1.desc": "編集したいJPEGファイルを選択してください。",
    "step1.choose": "画像を選択",
    "step1.dropTitle": "JPEGファイルをドラッグ＆ドロップ",
    "step1.dropSubtitle": "またはクリックして選択",
    "step1.clear": "すべて削除",
    "btn.next": "次へ →",
    "btn.prev": "← 戻る",

    "step2.presetLabel": "プリセット選択",
    "step2.searchPlaceholder": "プリセット検索...",
    "step2.manualLabel": "手動タグ追加",
    "step2.tagLabel": "Tag (IFD0 または ExifIFD)",
    "step2.valueLabel": "値",
    "step2.valuePlaceholder": "例: Olympus mju",
    "step2.add": "追加",
    "step2.pendingLabel": "設定済みEXIFエントリ",

    "step3.applyExif": "EXIF 適用",
    "step3.downloadAll": "一括ダウンロード",
    "summary.images": "画像",
    "summary.entries": "EXIFエントリ",
    "unit.images": "枚",
    "unit.entries": "件",

    "preset.title": "プリセット管理",
    "preset.hardClear": "すべて削除",
    "preset.resetDefault": "初期値に復元",
    "preset.mergeDefault": "初期値Merge",
    "preset.export": "Export",
    "preset.import": "Import",
    "preset.merge": "Merge",
    "preset.groups": "グループ",
    "preset.groupsDesc": "グループ名を入力し、EXIFタグを連携してください。",
    "preset.groupName": "グループ名",
    "preset.groupNamePlaceholder": "例: Film, Camera, Lens",
    "preset.tagMapping": "EXIFタグマッピング",
    "preset.addGroup": "グループ追加",
    "preset.values": "値リスト",
    "preset.valuesDesc": "アクティブグループを選択してプリセット値を追加してください。",
    "preset.activeGroup": "アクティブグループ",
    "preset.valuePlaceholder": "例: kodak_ultramax_400",
    "preset.addValue": "値を追加",

    "merge.title": "プリセットMerge",
    "merge.desc": "インポートするグループと値を選択してください。",
    "merge.cancel": "キャンセル",
    "merge.confirm": "Merge 実行",
    "merge.close": "閉じる",

    "action.remove": "削除",
    "action.edit": "編集",
    "action.download": "ダウンロード",
    "action.removeFromList": "リストから削除",

    "status.imageCleared": "すべての画像が削除されました。",
    "status.entryAdded": "EXIFエントリが追加されました。",
    "status.entriesCleared": "すべてのEXIFエントリが削除されました。",
    "status.applyingExif": "EXIFを適用中...",
    "status.noImages": "画像を1枚以上アップロードしてください。",
    "status.noDownload": "ダウンロードする画像がありません。アップロード後にEXIFを適用してください。",
    "status.downloadStarted": "ダウンロードを開始します。",
    "status.zipLoading": "ZIPライブラリを読み込み中。しばらくしてから再試行してください。",
    "status.zipCreating": "ZIPファイル作成中...",
    "status.zipDownload": "{count}枚をZIPでダウンロードします。",
    "status.zipFailed": "ZIP作成失敗: {error}",
    "status.loadingImages": "画像読み込み中...",
    "status.groupAdded": "グループが追加されました。",
    "status.groupRemoved": "グループが削除されました。",
    "status.valueAdded": "値が追加されました。",
    "status.valueRemoved": "グループから値が削除されました。",
    "status.presetNotFound": "プリセット値が見つかりません。",
    "status.presetApplied": "{group}プリセットが{tag}に適用されました。",
    "status.presetAppliedHint": "プリセットが適用されました。EXIF適用ボタンをクリックしてください。",
    "status.createGroupFirst": "まずグループを作成してください。",
    "status.exported": "プリセットJSONをエクスポートしました。",
    "status.imported": "{file}からプリセットをインポートしました。",
    "status.importFailed": "インポート失敗: {error}",
    "status.mergeFailed": "Mergeファイル読み込み失敗: {error}",
    "status.merged": "プリセットが統合されました。",
    "status.hardCleared": "すべてのプリセットが削除されました。",
    "status.resetDone": "初期プリセットに復元されました。",

    "confirm.hardClear": "すべてのプリセットを削除します。続行しますか？",
    "confirm.resetDefault": "初期プリセットに復元します。現在のプリセットは失われます。続行しますか？",

    "empty.noEntries": "設定済みEXIFエントリがありません。",
    "empty.noEntriesYet": "EXIFエントリはまだありません。",
    "empty.noImages": "画像がまだ読み込まれていません。",
    "empty.noExif": "EXIFデータが見つかりません。",
    "empty.noGroups": "グループを追加してプリセットを作成してください。",
    "empty.noGroupsOption": "グループなし",
    "empty.selectGroup": "グループを選択して値を表示してください。",
    "empty.noValues": "保存された値がありません。下から追加してください。",
    "empty.noMatch": "一致する値なし",
    "empty.selectedNone": "選択された項目なし",

    "count.entriesLabel": "設定済みEXIFエントリ ({count})",
    "count.filtered": "{total}件中 {match}件表示",
    "count.mergeSelected": "{count}件の値を選択中",
    "count.mergeNewGroups": "新規グループ{count}件を含む",

    "merge.existsGroup": "既存",
    "merge.newGroup": "新規グループ",
    "merge.existsValue": "既存",
    "merge.newValue": "新規",

    "loading.working": "処理中...",
    "loading.selectedImage": "選択された画像",

    "theme.system": "システム",
    "theme.dark": "ダーク",
    "theme.light": "ライト",

    "update.available": "{version}のアップデートがあります",
    "update.download": "ダウンロード",
    "update.newVersion": "→ {version} 新バージョン",

    "film.label": "フィルム",
    "film.targetTag": "名前タグ",
    "film.name": "フィルム名",
    "film.namePlaceholder": "例: kodak_portra_400",
    "film.apply": "適用",
    "film.selected": "{name}を選択しました（ISOを変更できます）",
    "film.applied": "フィルム{name}を適用しました。（ISO: {iso}）",
    "film.added": "フィルムが追加されました。",
    "film.removed": "フィルムが削除されました。",
    "film.resetDone": "フィルムプリセットを初期化しました。",
    "film.empty": "登録されたフィルムがありません。",
    "film.isoOverride": "ISO変更",
    "film.applyIso": "ISO適用",
    "film.isoUpdated": "ISOが{iso}に変更されました。",
    "film.searchPlaceholder": "フィルム検索...",
    "film.pageInfo": "{current} / {total} ページ",
  },
};

let currentLang = "ko";

function detectBrowserLang() {
  const browserLang = (navigator.language || "").toLowerCase();
  if (browserLang.startsWith("ja")) return "ja";
  if (browserLang.startsWith("en")) return "en";
  if (browserLang.startsWith("ko")) return "ko";
  return "en";
}

export function initI18n() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && translations[saved]) {
    currentLang = saved;
  } else {
    currentLang = detectBrowserLang();
  }
  applyI18n();
}

export function setLang(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang === "ko" ? "ko" : lang === "ja" ? "ja" : "en";
  document.title = t("page.title");
  applyI18n();
}

export function getLang() {
  return currentLang;
}

export function t(key, params = {}) {
  const str = translations[currentLang]?.[key] ?? translations.en[key] ?? key;
  return str.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`);
}

function applyI18n() {
  document.documentElement.lang = currentLang === "ko" ? "ko" : currentLang === "ja" ? "ja" : "en";
  document.title = t("page.title");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    el.alt = t(el.dataset.i18nAlt);
  });
}
