# web-exif-for-film

Browser-only EXIF batch editor for scanned film images.

Upload JPEGs, configure EXIF tags (manually or via presets), apply them in bulk, and download as ZIP. No server — everything runs client-side.

## Features

- **3-step wizard** — Upload → EXIF settings → Apply & Download
- **Preset system** — Film / Camera / FocalLength / Dev groups with one-click apply
- **Preset management** — Add, rename, reorder, delete groups & values. JSON export/import/merge
- **ZIP download** — Batch download all edited images as a single ZIP
- **i18n** — Korean, English, Japanese
- **Light/Dark theme** — System preference or manual toggle

## Getting Started

No build step. Serve with any static server:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in a browser.

## Progress

- [x] EXIF editing on browser (piexifjs)
- [x] Preset system with localStorage persistence
- [x] Export / Import / Merge presets (JSON)
- [x] ZIP batch download (JSZip)
- [x] i18n (ko / en / ja)
- [x] Light / Dark / System theme
- [ ] PWA setting
- [ ] CD setting

## License

[MIT](LICENSE)

## References

- [exiftool.org — EXIF Tag Names](https://exiftool.org/TagNames/EXIF.html)
- [piexifjs](https://github.com/nicklasaven/piexif.js)
