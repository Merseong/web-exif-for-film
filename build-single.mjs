/**
 * Bundles the project into a single self-contained HTML file.
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

async function main() {
  console.log("Fetching CDN dependencies...");
  const [piexifSrc, jszipSrc] = await Promise.all([
    fetchUrl("https://cdn.jsdelivr.net/npm/piexifjs"),
    fetchUrl("https://cdn.jsdelivr.net/npm/jszip@3/dist/jszip.min.js"),
  ]);

  console.log("Reading local files...");
  const css = read("css/style.css");
  const jsModules = [
    "scripts/i18n.js",
    "scripts/state.js",
    "scripts/exifEditor.js",
    "scripts/fileHandler.js",
    "scripts/presets.js",
    "scripts/ui.js",
    "scripts/main.js",
  ];

  // Read and strip import/export for inlining
  let combinedJs = "";
  for (const mod of jsModules) {
    let src = read(mod);
    // Remove import statements
    src = src.replace(/^import\s+.*?from\s+["'].*?["'];?\s*$/gm, "");
    // Remove export keywords (export function, export const, export async)
    src = src.replace(/^export\s+(default\s+)?/gm, "");
    combinedJs += `// --- ${mod} ---\n${src}\n\n`;
  }

  // Read index.html and extract just the body content
  const html = read("index.html");
  const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/);
  const bodyContent = bodyMatch ? bodyMatch[1] : "";

  // Remove script/link tags from body that reference external files
  const cleanBody = bodyContent
    .replace(/<script[^>]*src=["'][^"']*["'][^>]*><\/script>/g, "")
    .replace(/<link[^>]*rel=["']manifest["'][^>]*\/?>/g, "")
    .replace(/<link[^>]*rel=["']apple-touch-icon["'][^>]*\/?>/g, "");

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
// --- piexifjs ---
${piexifSrc}
</script>
<script>
// --- jszip ---
${jszipSrc}
</script>
<script>
(function() {
${combinedJs}
})();
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
