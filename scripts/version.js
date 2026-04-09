import { t } from "./i18n.js";

export const CURRENT_VERSION = "0.1.0";

const REPO = "Merseong/web-exif-for-film";
const CHECK_INTERVAL = 1000 * 60 * 60; // 1 hour
const CACHE_KEY = "exifEditorLatestVersion";

export function initVersionCheck() {
  const footerVersionEl = document.getElementById("footerVersion");
  if (footerVersionEl) {
    footerVersionEl.textContent = `v${CURRENT_VERSION}`;
  }

  checkForUpdate();
}

async function checkForUpdate() {
  try {
    // Use cached result if recent
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (cached && Date.now() - cached.checkedAt < CHECK_INTERVAL) {
      if (cached.tag && cached.tag !== `v${CURRENT_VERSION}`) {
        showUpdate(cached.tag, cached.url);
      }
      return;
    }

    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`);
    if (!res.ok) return;
    const data = await res.json();
    const tag = data.tag_name;
    const url = data.html_url;

    localStorage.setItem(CACHE_KEY, JSON.stringify({ tag, url, checkedAt: Date.now() }));

    if (tag && tag !== `v${CURRENT_VERSION}`) {
      showUpdate(tag, url);
    }
  } catch {
    // Silently fail - offline or rate limited
  }
}

function showUpdate(tag, url) {
  // Top banner
  const banner = document.getElementById("updateBanner");
  const message = document.getElementById("updateMessage");
  const link = document.getElementById("updateLink");
  const dismiss = document.getElementById("updateDismiss");

  if (banner && message && link) {
    message.textContent = t("update.available", { version: tag });
    link.href = url;
    link.textContent = t("update.download");
    banner.classList.remove("update-banner--hidden");

    dismiss?.addEventListener("click", () => {
      banner.classList.add("update-banner--hidden");
    });
  }

  // Footer
  const footerUpdate = document.getElementById("footerUpdate");
  if (footerUpdate) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = t("update.newVersion", { version: tag });
    a.style.color = "var(--accent-strong)";
    footerUpdate.appendChild(a);
  }
}
