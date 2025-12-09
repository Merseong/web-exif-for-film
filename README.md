# web-exif-for-film

EXIF editor for film image

## Purpose

Add EXIF data for scaned images from film

Easier way only for film

## Progress

- [x] EXIF editing only on browser
- [x] preset film / camera -> EXIF for local
- [x] export / import settings of film, camera, matching pair -> save on local storage
- [] exif reader -> what film is it?
- [] PWA setting
- [] CD setting

# Presets

- Presets are stored in `localStorage` and can be exported/imported as JSON from the UI.
- Groups map to a single EXIF tag; selecting a value writes that tag into the pending EXIF entries.
- Default configuration: `Film` group mapped to `Model (0x0110)` with the following values:
  - `kodak_ultramax_400`
  - `kodak_gold_200`
  - `kodak_ektar_100`
  - `kodak_portra_160`
  - `harman_phoenix_200`
  - `cinestill_800T`
  - `cinestill_400D`
  - `kodak_ektarchrome_e100d`
  - `kodak_ektarchrome_e100`
  - `kentmere_pan_100`

# References

[exiftool.org](https://exiftool.org/TagNames/EXIF.html)
