---
name: runtime-symptoms
description: Visual / console symptoms when validator passes but the page is wrong
---

# Runtime Symptoms (validator passes but page is wrong)

For when the validator gives a green light but the user reports something visually broken. Open DevTools console first; most issues surface there.

## Map area is blank / "Failed to load tile"

- Open DevTools Network tab. Filter for `tile`.
- 403 responses → using raw OSM. Switch to CartoDB (see `osm-direct` in `validator-errors.md`).
- All requests pending → Leaflet JS missing or load order wrong. Confirm `<script src="...leaflet.js">` is in `<head>` (without `defer`) OR ensure `initMap` runs after `DOMContentLoaded`.
- Empty map but tiles load → `pois[]` is empty or `lat`/`lng` is null. Phase 4 didn't geocode.

## Page shows `[object Object]` somewhere

A nested i18n object leaked into the DOM as a raw `${obj}`. Find the unprotected interpolation.
- Search `app.js` for `${` followed by `.name` / `.desc` / `.addr` etc. without `L(...)`.
- Wrap with `L()`: ``L(poi.name)`` not ``poi.name``.

## Layout completely unstyled / broken

Tailwind didn't load.
- Check Network tab for `cdn.tailwindcss.com`. If 404 / blocked, the user is offline or behind a firewall.
- Confirm the `<script src="https://cdn.tailwindcss.com"></script>` is in `<head>` — order matters, must come before any markup that needs styling.
- The shell uses Tailwind v3 JIT runtime; do NOT pin to v2.

## Wrong fonts / squares for CJK characters

Google Fonts didn't load Noto Sans.
- Confirm `<link>` URL includes `Noto+Sans+TC` (and `JP`/`KR` for Japan/Korea trips).
- Check Network tab for blocks.
- Fallback: `font-family: var(--font)` in style.css. Default stack must include `system-ui, sans-serif`.

## Language switcher missing / not switching

- Single-lang mode (`supportedLangs.length === 1`): switcher is supposed to be hidden. **This is correct behavior.**
- Multi-lang but switcher not rendering: check `<div id="lang-switcher">` exists in `index.html`.
- Switcher renders but click does nothing: check `bindLanguageSwitcher()` is called in `bootstrap()`.
- Click changes lang but UI doesn't update: `applyLang()` isn't calling `renderAll()` or specific `renderXxx()` functions.

## Calendar shows wrong "now" line

- Off by hours: timezone bug. `DEST_TZ` should match the destination, not user's local browser TZ.
- Always at midnight: `nowHour` calculation using UTC instead of local time. Use `now.getHours()` + `now.getMinutes()/60`, NOT `toISOString()`.

## Today overlay shows yesterday's date

Classic UTC vs local time bug.
- Wrong: `now.toISOString().slice(0,10)` — UTC.
- Right: `now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0')` — local.

## Currency switcher pills wrong

- Wrong currencies: re-derive from passport country + destination(s). See `trip-html-generator/references/components.md §Currency Switcher`.
- Switcher present but doesn't update prices: every monetary value needs a `data-cost` attribute. Check the renderer didn't skip it.

## Cover page won't dismiss / Today page stuck

- Click handler not bound: confirm `<button class="cover-enter" onclick="enterApp()">` (or addEventListener equivalent).
- Animation not running: `style.css` must have the `.cover-hidden` rule with `transform: translateY(-100vh)` and a `transition`.

---

# CDN Failures (page fully blank)

If nothing renders and DevTools shows multiple failed CDN requests:

1. **User is offline.** Tell user to reconnect.
2. **Firewall blocking unpkg / Google Fonts / Tailwind CDN.** Some corporate networks block these.
   - Workaround: download the JS/CSS files locally and update tags to relative paths. Breaks the "self-contained CDN" promise but works offline.
3. **CDN URL typo.** Compare `index.html` against `trip-html-generator/references/cdn-and-styling.md` verbatim.
4. **Tailwind CDN was rate-limited.** Rare. Retry after 60s.

---

# Phase 5 Mid-Generation Failures

The user invoked Phase 5 and it stopped/timed out partway through. Don't restart from scratch.

1. Read `data/trip.json._progress.phase5_step`.
2. Match against `phase-5-generation-strategy.md` sections (B1–B5 / C1–C8 / D).
3. Resume at the **next** step. Don't overwrite earlier sections.

If `_progress` is missing, the run died too early to checkpoint. Inspect the folder:
- `data/trip.json` exists with `cities[]` populated → resume at B2.
- `data/trip.json` exists with `pois[]` populated → resume at B4.
- `app.js` exists with bootstrap only (no render functions) → resume at C2.
- `app.js` looks complete but no `index.html` → resume at D.
