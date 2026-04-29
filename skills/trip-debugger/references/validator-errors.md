---
name: validator-errors
description: Validator error code → root cause + fix mapping
---

# Validator Errors → Fixes

For each error code that `validate-trip.mjs` can emit, what causes it and how to fix it. Use this when the validator output names a specific rule.

## `files: missing: <path>`

A required file is absent. Phase 5 didn't complete or someone deleted it.
- Re-run the missing step from `phase-5-generation-strategy.md`. Don't manually fabricate the file — re-derive from `trip.json`.

## `schema: trip.json missing top-level field: <field>`

The JSON is missing a required field (`lang`, `supportedLangs`, `cities`, `i18n`, `pois`, `schedule`, etc).
- Open `trip.json`, add the field with a sensible default (empty array, single-key i18n object).
- Re-run schema-only validator.

## `i18n: missing key "<key>" for lang "<lang>"`

`supportedLangs` declares a lang, but the `i18n` block is incomplete. Most common in single-lang trips that miss component keys (`today_now`, `clock_dest`, `cover.go`).
- Add the missing key under `trip.i18n.{lang}.{key}` with a translated value.
- The full required-key list is in `validate-trip.mjs § REQUIRED_I18N_KEYS`.

## `flat-i18n: $.path.field uses forbidden flat-sibling i18n key`

You wrote `name_en: "..."` instead of `name: { "en": "..." }`. **Most common Phase 5 mistake.**
- Search `trip.json` for any `name_en`, `name_ja`, `name_ko`, `desc_en`, `note_ko`, etc.
- Convert each into the parent's nested form:
  ```json
  // Before
  "name": "釜山", "name_en": "Busan", "name_ja": "釜山"
  // After
  "name": { "zh": "釜山", "en": "Busan", "ja": "釜山" }
  ```

## `bare-string-i18n: $.path.field is a bare string`

A field that should be a nested i18n object is a raw string. Wrap it.
- `"desc": "Coastal city"` → `"desc": { "zh": "Coastal city" }` (single-lang).

## `city-ref: $.pois[N].city = "X" not found in cities[]`

A POI / schedule / weather entry references a city id that doesn't exist in `cities[]`.
- Either add the missing city to `cities[]` (with `id`, nested-i18n `name`, `color`, `icon`).
- Or change the reference to an existing city id.
- City ids are lowercase ASCII slugs (`busan`, `aso`, `tokyo`).

## `shell: index.html contains trip-specific token "<token>"`

You leaked trip data into the HTML. The shell must be 100% generic.
- Search `index.html` for the leaked token. Replace with `<span data-i18n="key"></span>` or remove.
- The renderer fills these via `t(key)` from `trip.i18n`.

## `forbidden-array: app.js declares WEATHER_DATA / POIS / SCHEDULE / NOMAD_SPOTS / SCHEDULE_CITY_I18N`

You hardcoded data into app.js. Read from `TRIP.weather`, `TRIP.pois`, etc.
- Delete the const declaration in app.js.
- Replace usages: `WEATHER_DATA.forEach` → `TRIP.weather.forEach`, etc.
- Move the data into the corresponding `trip.json` field if it isn't already there.

## `lang-ladder: app.js appears to use a conditional language ladder`

You wrote `currentLang === 'zh' ? '中文' : 'English'`. Use `t('key')` and add the i18n entry.
- Add the key to every `supportedLangs` block in `trip.i18n`.
- Replace the ternary with `t('your.key')`.

## `map-placement: id="map" must be inside <section id="tab-time">`

Leaflet's `L.map('map')` binds to the first DOM element with `id="map"`. Duplicates break both tabs.
- Remove duplicates. The single `id="map"` lives in `<section id="tab-time">`.

## `cdn-tailwind / cdn-leaflet-js / cdn-leaflet-css / cdn-google-fonts / cdn-noto-sans-tc / cdn-material-symbols`

A required CDN tag is missing from `index.html`. Without it the page silently breaks (no styles / no map / wrong fonts).
- Copy the missing tag from `trip-html-generator/references/cdn-and-styling.md` into `<head>`.

## `osm-direct: app.js uses tile.openstreetmap.org directly`

Browsers get 403 from raw OSM tile servers. Switch to CartoDB Voyager.
- Find `L.tileLayer(...)` in app.js.
- Replace URL with: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`
- Add options: `{ subdomains: 'abcd', maxZoom: 20, attribution: '© OpenStreetMap contributors © CARTO' }`.
