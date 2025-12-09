import { handleFiles, removeImage } from "./fileHandler.js";
import {
  COMMON_IFD0_TAGS,
  COMMON_EXIF_TAGS,
  addEntry,
  applyExifToImages,
  clearEntries,
  removeEntry,
} from "./exifEditor.js";
import {
  registerRemoveHandlers,
  renderEntries,
  renderImages,
  updateApplyStatus,
  updateUploadStatus,
} from "./ui.js";

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const entryForm = document.getElementById("entryForm");
  const tagSelect = document.getElementById("tagSelect");
  const tagValue = document.getElementById("tagValue");
  const applyButton = document.getElementById("applyExif");
  const clearEntriesBtn = document.getElementById("clearEntries");

  const allTags = [
    ...COMMON_IFD0_TAGS.map((tag) => ({ ...tag, ifd: "0th" })),
    ...COMMON_EXIF_TAGS.map((tag) => ({ ...tag, ifd: "Exif" })),
  ];

  allTags.forEach((tag, index) => {
    const option = document.createElement("option");
    option.value = tag.key;
    option.textContent = `${tag.label} [${tag.ifd}] (0x${tag.key
      .toString(16)
      .padStart(4, "0")})`;
    option.dataset.label = tag.label;
    option.dataset.ifd = tag.ifd;
    if (index === 0) {
      option.selected = true;
      option.defaultSelected = true;
    }
    tagSelect.appendChild(option);
  });

  registerRemoveHandlers({
    image: removeImage,
    entry: (entryId) => {
      removeEntry(entryId);
      renderEntries();
    },
  });

  fileInput.addEventListener("change", (event) => {
    handleFiles(event.target.files);
    fileInput.value = "";
  });

  entryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const selectedTag = tagSelect.options[tagSelect.selectedIndex];
      addEntry(
        selectedTag.dataset.ifd,
        selectedTag.value,
        tagValue.value,
        selectedTag.dataset.label
      );
      renderEntries();
      entryForm.reset();
      updateApplyStatus(
        "EXIF entry added. Click Apply EXIF to write it to your images.",
        ""
      );
    } catch (error) {
      updateUploadStatus(error.message, "error");
    }
  });

  clearEntriesBtn.addEventListener("click", () => {
    clearEntries();
    renderEntries();
    updateApplyStatus("All EXIF entries cleared.", "warning");
  });

  applyButton.addEventListener("click", () => {
    const result = applyExifToImages();
    renderImages();
    const tone = result.success ? "success" : "error";
    updateApplyStatus(result.message, tone);
  });

  // Initial render
  renderEntries();
  renderImages();
});
