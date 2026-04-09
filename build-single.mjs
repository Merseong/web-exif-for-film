/**
 * Bundles the project into a single self-contained HTML file.
 * Each JS module is wrapped in an IIFE with a shared registry to avoid naming conflicts.
 *
 * Usage: node build-single.mjs
 * Output: build/exif-editor.html
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import https from "https";

const ROOT = new URL(".", import.meta.url).pathname;

function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const get = (u) => {
      https.get(u, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          get(res.headers.location);
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        res.on("error", reject);
      }).on("error", reject);
    };
    get(url);
  });
}

/**
 * Module definitions with explicit dependency mapping.
 * `id` is the registry key. `file` is the source path.
 * `imports` maps local variable names to `registryKey.exportName`.
 * `exports` lists the names this module exports.
 */
const MODULES = [
  {
    id: "i18n",
    file: "scripts/i18n.js",
    imports: {},
    exports: ["t", "initI18n", "setLang", "getLang"],
  },
  {
    id: "state",
    file: "scripts/state.js",
    imports: {},
    exports: ["state", "on", "emit", "nextId", "resetState"],
  },
  {
    id: "exifEditor",
    file: "scripts/exifEditor.js",
    imports: {
      "state": "state.state",
      "emit": "state.emit",
    },
    exports: [
      "COMMON_IFD0_TAGS", "COMMON_EXIF_TAGS", "TAG_LABELS",
      "addEntry", "setEntry", "clearEntries", "removeEntry", "applyExifToImages",
    ],
  },
  {
    id: "fileHandler",
    file: "scripts/fileHandler.js",
    imports: {
      "nextId": "state.nextId",
      "state": "state.state",
      "emit": "state.emit",
    },
    exports: ["handleFiles", "removeImage"],
  },
  {
    id: "presets",
    file: "scripts/presets.js",
    imports: {
      "state": "state.state",
      "emit": "state.emit",
    },
    exports: [
      "normalizePresets", "initPresetStore", "getPresetGroups",
      "getActivePresetGroup", "setActivePresetGroup",
      "addPresetGroup", "removePresetGroup",
      "addPresetValue", "removePresetValue", "getPresetValue",
      "renameGroup", "renameValue", "reorderGroup", "reorderValue",
      "exportPresetJson", "importPresetFile", "importPresetJson",
      "mergePresets", "hardClearPresets", "resetPresetsToDefault", "getDefaultPresets",
    ],
  },
  {
    id: "ui",
    file: "scripts/ui.js",
    imports: {
      "state": "state.state",
      "on": "state.on",
      "emit": "state.emit",
      "TAG_LABELS": "exifEditor.TAG_LABELS",
      "t": "i18n.t",
    },
    exports: [
      "initUI", "rerenderAll",
      "updateUploadStatus", "updateApplyStatus", "updatePresetStatus",
      "showLoading", "hideLoading", "showImageDetail",
      "renderEntries", "renderImages", "renderPresetGroups", "renderPresetValues",
      "renderPresetCards", "renderThumbnails", "renderEntryChips",
      "renderApplySummary", "renderTabs", "renderStepper", "renderStep",
      "showMergeModal", "hideMergeModal", "getMergeSelections", "getMergeIncoming",
    ],
  },
  {
    id: "main",
    file: "scripts/main.js",
    imports: {
      "handleFiles": "fileHandler.handleFiles",
      "removeImage": "fileHandler.removeImage",
      "COMMON_IFD0_TAGS": "exifEditor.COMMON_IFD0_TAGS",
      "COMMON_EXIF_TAGS": "exifEditor.COMMON_EXIF_TAGS",
      "addEntry": "exifEditor.addEntry",
      "applyExifToImages": "exifEditor.applyExifToImages",
      "clearEntries": "exifEditor.clearEntries",
      "removeEntry": "exifEditor.removeEntry",
      "setEntry": "exifEditor.setEntry",
      "state": "state.state",
      "on": "state.on",
      "emit": "state.emit",
      "initUI": "ui.initUI",
      "rerenderAll": "ui.rerenderAll",
      "updateApplyStatus": "ui.updateApplyStatus",
      "updatePresetStatus": "ui.updatePresetStatus",
      "updateUploadStatus": "ui.updateUploadStatus",
      "showLoading": "ui.showLoading",
      "hideLoading": "ui.hideLoading",
      "showMergeModal": "ui.showMergeModal",
      "hideMergeModal": "ui.hideMergeModal",
      "getMergeSelections": "ui.getMergeSelections",
      "getMergeIncoming": "ui.getMergeIncoming",
      "renderPresetCards": "ui.renderPresetCards",
      "addPresetGroup": "presets.addPresetGroup",
      "addPresetValue": "presets.addPresetValue",
      "getActivePresetGroup": "presets.getActivePresetGroup",
      "getPresetValue": "presets.getPresetValue",
      "importPresetFile": "presets.importPresetFile",
      "initPresetStore": "presets.initPresetStore",
      "removePresetGroup": "presets.removePresetGroup",
      "removePresetValue": "presets.removePresetValue",
      "setActivePresetGroup": "presets.setActivePresetGroup",
      "exportPresetJson": "presets.exportPresetJson",
      "renameGroup": "presets.renameGroup",
      "renameValue": "presets.renameValue",
      "reorderGroup": "presets.reorderGroup",
      "reorderValue": "presets.reorderValue",
      "mergePresets": "presets.mergePresets",
      "normalizePresets": "presets.normalizePresets",
      "hardClearPresets": "presets.hardClearPresets",
      "resetPresetsToDefault": "presets.resetPresetsToDefault",
      "getDefaultPresets": "presets.getDefaultPresets",
      "initI18n": "i18n.initI18n",
      "setLang": "i18n.setLang",
      "getLang": "i18n.getLang",
      "t": "i18n.t",
    },
    exports: [],
  },
];

function buildModuleCode(mod) {
  let src = read(mod.file);

  // Strip import statements
  src = src.replace(/^import\s+\{[^}]*\}\s+from\s+["'][^"']*["'];?\s*$/gm, "");
  src = src.replace(/^import\s+\w+\s+from\s+["'][^"']*["'];?\s*$/gm, "");

  // Strip export keywords
  src = src.replace(/^export\s+(async\s+)?function\s/gm, "$1function ");
  src = src.replace(/^export\s+(const|let|var)\s/gm, "$1 ");

  // Build import destructuring from registry
  const importEntries = Object.entries(mod.imports);
  const importLine = importEntries.length > 0
    ? `  const { ${importEntries.map(([local, path]) => {
        const [, name] = path.split(".");
        return local === name ? local : `${name}: ${local}`;
      }).join(", ")} } = (function() {
    const _r = {};
    ${[...new Set(importEntries.map(([, p]) => p.split(".")[0]))].map(
      (k) => `Object.assign(_r, __R.${k});`
    ).join(" ")}
    return _r;
  })();\n`
    : "";

  // Build export assignments
  const exportLine = mod.exports.length > 0
    ? `\n  Object.assign(__R.${mod.id}, { ${mod.exports.join(", ")} });`
    : "";

  return `// --- ${mod.file} ---\n__R.${mod.id} = {};\n(function() {\n${importLine}${src}${exportLine}\n})();\n`;
}

async function main() {
  console.log("Fetching CDN dependencies...");
  const [piexifSrc, jszipSrc] = await Promise.all([
    fetchUrl("https://cdn.jsdelivr.net/npm/piexifjs"),
    fetchUrl("https://cdn.jsdelivr.net/npm/jszip@3/dist/jszip.min.js"),
  ]);

  console.log("Building module bundle...");
  let bundle = "const __R = {};\n\n";
  for (const mod of MODULES) {
    bundle += buildModuleCode(mod) + "\n";
  }

  const html = read("index.html");
  const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/);
  const bodyContent = bodyMatch ? bodyMatch[1] : "";

  // Remove external script/link tags
  const cleanBody = bodyContent
    .replace(/<script[^>]*src=["'][^"']*["'][^>]*>[\s\S]*?<\/script>/g, "")
    .replace(/<script[^>]*type=["']module["'][^>]*>[\s\S]*?<\/script>/g, "")
    .replace(/<script>[\s\S]*?serviceWorker[\s\S]*?<\/script>/g, "")
    .replace(/<link[^>]*rel=["']manifest["'][^>]*\/?>/g, "")
    .replace(/<link[^>]*rel=["']apple-touch-icon["'][^>]*\/?>/g, "");

  const css = read("css/style.css");

  const output = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>EXIF Batch Editor</title>
<style>
${css}
</style>
</head>
<body>
${cleanBody}
<script>
${piexifSrc}
</script>
<script>
${jszipSrc}
</script>
<script>
${bundle}
</script>
</body>
</html>`;

  mkdirSync(join(ROOT, "build"), { recursive: true });
  const outPath = join(ROOT, "build", "exif-editor.html");
  writeFileSync(outPath, output);
  console.log(`Done: ${outPath} (${(output.length / 1024).toFixed(0)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
