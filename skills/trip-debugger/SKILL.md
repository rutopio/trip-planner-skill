---
name: trip-debugger
description: >
  Diagnose and fix failures in a generated trip plan. Use when the validator reports errors, when
  the user says the trip "looks broken / blank / wrong / not loading / shows [object Object] /
  map missing / fonts wrong / styles missing", or when Phase 5 generation aborted partway. Triggers
  on phrases like "the trip is broken", "validator says X", "it's blank", "fix the trip", "why is
  the map missing", "the prices look wrong", "language switcher not working".
---

# Trip Debugger — Diagnose and Fix Generation Failures

Trip plans break in predictable ways. This skill maps each symptom to its root cause and fix, ordered by frequency. Always start by running the validator — most issues are caught there.

```bash
node skills/trip-html-generator/scripts/validate-trip.mjs <trip-folder>
```

Use the validator output to jump to the matching section below.

---

## Diagnostic Triage (run in this order)

### 1. Does `data/trip.json` exist and parse?
```bash
node -e "JSON.parse(require('fs').readFileSync('<folder>/data/trip.json'))" && echo OK
```
- ❌ "Unexpected token" → trip.json corrupted mid-write. **Fix:** restore from git or re-run Phase 5 from `_progress.phase5_step` checkpoint.
- ❌ File missing → Phase 5 didn't reach B1. Re-run Phase 5.

### 2. Does the validator pass?
- ✅ Green → bug is runtime/visual, jump to §Runtime Symptoms.
- ❌ Red → fix validator errors first, jump to §Validator Errors.

### 3. Does the page actually load?
Open `http://localhost:8765` (after `python3 serve.py`). Open DevTools console.
- Console errors? → §Runtime Symptoms.
- Page blank with no errors? → CDN failure, jump to §CDN Failures.

---

## Validator Errors → Fixes

### `files: missing: <path>`

A required file is absent. Phase 5 didn't complete or someone deleted it.
- Re-run the missing step from [phase-5-generation-strategy.md](../trip-html-generator/references/phase-5-generation-strategy.md). Don't manually fabricate the file — re-derive from `trip.json`.

### `schema: trip.json missing top-level field: <field>`

The JSON is missing a required field (`lang`, `supportedLangs`, `cities`, `i18n`, `pois`, `schedule`, etc).
- Open `trip.json`, add the field with a sensible default (empty array, single-key i18n object, etc.).
- Re-run schema-only validator. Should now pass.

### `i18n: missing key "<key>" for lang "<lang>"`

`supportedLangs` declares a lang, but the `i18n` block is incomplete. Most common in single-lang trips that miss component keys (`today_now`, `clock_dest`, `cover.go`).
- Add the missing key under `trip.i18n.{lang}.{key}` with a translated value.
- The full required-key list is in `validate-trip.mjs § REQUIRED_I18N_KEYS`.

### `flat-i18n: $.path.field uses forbidden flat-sibling i18n key`

You wrote `name_en: "..."` instead of `name: { "en": "..." }`. This is the most common Phase 5 mistake.
- Search `trip.json` for any `name_en`, `name_ja`, `name_ko`, `desc_en`, etc.
- Convert each into the parent object's nested form. Example:
  ```json
  // Before
  "name": "釜山", "name_en": "Busan", "name_ja": "釜山"
  // After
  "name": { "zh": "釜山", "en": "Busan", "ja": "釜山" }
  ```

### `bare-string-i18n: $.path.field is a bare string`

A field that should be a nested i18n object is a raw string. Wrap it.
- `"desc": "Coastal city"` → `"desc": { "zh": "Coastal city" }` (single-lang).

### `city-ref: $.pois[N].city = "X" not found in cities[]`

A POI/schedule/weather entry references a city id that doesn't exist in `cities[]`.
- Either add the missing city to `cities[]` (with `id`, `name` i18n object, `color`, `icon`).
- Or change the reference to an existing city id.
- City ids are lowercase ASCII slugs (`busan`, `aso`, `tokyo`).

### `shell: index.html contains trip-specific token "<token>"`

You leaked trip data into the HTML. The shell must be 100% generic — every trip-specific string lives in `trip.json`.
- Search `index.html` for the leaked token. Replace with `<span data-i18n="key"></span>` or remove.
- The renderer fills these via `t(key)` from `trip.i18n`.

### `forbidden-array: app.js declares WEATHER_DATA / POIS / SCHEDULE / NOMAD_SPOTS / SCHEDULE_CITY_I18N`

You hardcoded data into app.js. Read from `TRIP.weather`, `TRIP.pois`, etc. instead.
- Delete the const declaration in app.js.
- Replace usages: `WEATHER_DATA.forEach` → `TRIP.weather.forEach`, etc.
- Move the data into the corresponding `trip.json` field if it isn't already there.

### `lang-ladder: app.js appears to use a conditional language ladder`

You wrote `currentLang === 'zh' ? '中文' : 'English'`. Use `t('key')` and add the i18n entry.
- Add the key to every `supportedLangs` block in `trip.i18n`.
- Replace the ternary with `t('your.key')`.

### `map-placement: id="map" must be inside <section id="tab-time">`

Leaflet's `L.map('map')` binds to the first DOM element with `id="map"`. If you have one in Overview AND one in Spots, only the Overview map renders and the Spots map is broken.
- Remove the duplicate. The single `id="map"` lives in `<section id="tab-time">`.

### `cdn-tailwind / cdn-leaflet-js / cdn-google-fonts / etc.`

A required CDN tag is missing from `index.html`. Without it the page silently breaks (no styles / no map / wrong fonts).
- Copy the missing tag from [cdn-and-styling.md](../trip-html-generator/references/cdn-and-styling.md) into `<head>`.

### `osm-direct: app.js uses tile.openstreetmap.org directly`

Browsers get 403 from raw OSM tile servers. Switch to CartoDB Voyager.
- Find `L.tileLayer(...)` in app.js.
- Replace URL with: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`
- Add options: `{ subdomains: 'abcd', maxZoom: 20, attribution: '© OpenStreetMap contributors © CARTO' }`.

---

## Runtime Symptoms (validator passes but page is wrong)

### Map area is blank / "Failed to load tile"

- Open DevTools Network tab. Filter for `tile`.
- 403 responses → using raw OSM. Switch to CartoDB (see `osm-direct` fix above).
- All requests pending → Leaflet JS missing or load order wrong. Confirm `<script src="...leaflet.js">` is in `<head>` (without `defer`) OR ensure `initMap` runs after `DOMContentLoaded`.
- Empty map but tiles load → `pois[]` is empty or `lat`/`lng` is null. Phase 4 didn't geocode.

### Page shows `[object Object]` somewhere

A nested i18n object leaked into the DOM as a raw `${obj}`. Find the unprotected interpolation.
- Search `app.js` for ``${`` followed by `.name` / `.desc` / `.addr` etc. without `L(...)`.
- Wrap with `L()`: ``L(poi.name)`` not ``poi.name``.

### Layout completely unstyled / broken

Tailwind didn't load.
- Check Network tab for `cdn.tailwindcss.com`. If 404 / blocked, the user is offline or behind a firewall.
- Confirm the `<script src="https://cdn.tailwindcss.com"></script>` is in `<head>` — order matters, must come before any markup that needs styling.
- The shell uses Tailwind v3 JIT runtime; do NOT pin to v2.

### Wrong fonts / squares for CJK characters

Google Fonts didn't load Noto Sans.
- Confirm `<link>` URL includes `Noto+Sans+TC` (and `JP`/`KR` for Japan/Korea trips).
- Check Network tab for blocks.
- Fallback: `font-family: var(--font)` in style.css. Default stack must include `system-ui, sans-serif`.

### Language switcher missing / not switching

- Single-lang mode (`supportedLangs.length === 1`): switcher is supposed to be hidden. This is correct behavior.
- Multi-lang but switcher not rendering: check `<div id="lang-switcher">` exists in `index.html`.
- Switcher renders but click does nothing: check `bindLanguageSwitcher()` is called in `bootstrap()`.
- Click changes lang but UI doesn't update: `applyLang()` isn't calling `renderAll()` or specific `renderXxx()` functions.

### Calendar shows wrong "now" line

- Off by hours: timezone bug. `DEST_TZ` should match the destination, not user's local browser TZ.
- Always at midnight: `nowHour` calculation using UTC instead of local time. Use `now.getHours()` + `now.getMinutes()/60`, NOT `toISOString()`.

### Today overlay shows yesterday's date

Classic UTC vs local time bug.
- Wrong: `now.toISOString().slice(0,10)` — UTC.
- Right: `now.getFullYear() + '-' + ... + '-' + ...` — local.

### Currency switcher pills wrong

- Wrong currencies: re-derive from passport country + destination(s). See [components.md §Currency Switcher](../trip-html-generator/references/components.md).
- Switcher present but doesn't update prices: every monetary value needs a `data-cost` attribute. Check the renderer didn't skip it.

### Cover page won't dismiss / Today page stuck

- Click handler not bound: confirm `<button class="cover-enter" onclick="enterApp()">` (or addEventListener equivalent).
- Animation not running: `style.css` must have the `.cover-hidden` rule with `transform: translateY(-100vh)` and a `transition`.

---

## CDN Failures (page fully blank)

If nothing renders and DevTools shows multiple failed CDN requests:

1. **User is offline.** This skill requires internet connectivity. Tell user to reconnect.
2. **Firewall blocking unpkg / Google Fonts / Tailwind CDN.** Some corporate networks block these.
   - Workaround: download the JS/CSS files locally and update tags to relative paths. This breaks the "self-contained CDN" promise but works offline.
3. **CDN URL typo.** Compare `index.html` against [cdn-and-styling.md](../trip-html-generator/references/cdn-and-styling.md) verbatim.
4. **Tailwind CDN was rate-limited.** Rare but possible. Retry after 60s.

---

## Phase 5 Mid-Generation Failures

The user invoked Phase 5 and it stopped/timed out partway through. Don't restart from scratch.

1. Read `data/trip.json._progress.phase5_step`.
2. Match against [phase-5-generation-strategy.md](../trip-html-generator/references/phase-5-generation-strategy.md) sections (B1–B5 / C1–C8 / D).
3. Resume at the **next** step. Don't overwrite earlier sections.

If `_progress` is missing, the run died too early to checkpoint. Inspect the folder:
- `data/trip.json` exists with `cities[]` populated → resume at B2.
- `data/trip.json` exists with `pois[]` populated → resume at B4.
- `app.js` exists with bootstrap only (no render functions) → resume at C2.
- `app.js` looks complete but no `index.html` → resume at D.

---

## When To Escalate

If the trip is fundamentally misaligned (e.g., user says "this trip is to Korea but the data is for Japan"), this is not a debug — it's a **mutation**. Hand off to `trip-mutator`.

If the trip data is correct but visual aesthetic is off, hand off to `ui-style` to re-pick a style and regenerate `style.css` only (Phase 5 step D rerun).

If you've spent 10+ tool calls debugging without progress, **stop and re-run Phase 5 from B1**. A clean rebuild is faster than chasing accumulated drift.
