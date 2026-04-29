# Template Contract — `data/*.json` Shards Are the Single Source of Truth

**Goal:** every generated trip uses the **same** `index.html` and `app.js`. Only the per-trip `data/*.json` shards change. The HTML/JS shell is a dumb shell — it knows nothing about Tokyo, Busan, KRW, or "🌸". All trip-specific content is rendered from JSON at runtime.

**No `style.css` file exists** — all custom CSS is inlined in a `<style>` block inside `index.html` (see [cdn-and-styling.md](cdn-and-styling.md)). Tailwind CDN handles 90% of styling.

This contract is **mandatory**. The Phase 5 generator (`trip-html-generator`) MUST NOT violate it.

---

## The Rules

### 1. `index.html` contains ZERO trip-specific strings

- ❌ No destination names ("Busan", "Tokyo")
- ❌ No prices, dates, attraction names, restaurant names
- ❌ No tagline, no hotel names, no flight numbers
- ❌ No city-specific emoji or icons
- ❌ **No inline trip data.** No `<script id="trip-data">` block. Trip data is fetched from `data/*.json` shards at runtime by `app.js → loadTrip()`.
- ✅ Only structural markup: tab containers, empty `<div>` mounts, layout scaffolding
- ✅ The `<title>` is a generic placeholder (e.g., "Trip Plan") — `app.js` updates it from `trip.meta.json` on load
- ✅ The `<style>` block in `<head>` contains design tokens (CSS variables), Tailwind-can't-do exceptions (calendar absolute positioning, Cover/Today animations, Leaflet overrides, `@media print`). It contains NO trip-specific selectors.

### 2. `app.js` contains ZERO trip-specific strings or per-trip CSS classes

- ❌ No hardcoded city keys (`busan`, `aso`, `fukuoka`)
- ❌ No hardcoded ternary i18n: `isZh ? '中文' : 'English'` — use `t('key')`
- ❌ No `WEATHER_DATA = [...]` / `POIS = [...]` / `SCHEDULE = [...]` literal arrays. Read `TRIP.weather`, `TRIP.pois`, `TRIP.schedule` (loaded from shards).
- ❌ No CSS class names tied to specific cities (e.g., `wd-city-busan`)
- ✅ All rendering is data-driven. To color a city marker, read `city.color` from JSON; apply via inline `style` or CSS variables.
- ✅ Translation strings for UI chrome (tab labels, "Total", "Today", "Booked") live in `trip.meta.json → i18n` — keyed lookup via `t(key)`.

### 3. The `<style>` block in `index.html` contains ZERO trip-specific selectors

(There is no `style.css` file. All custom CSS lives in this block.)

- ❌ No `.wd-city-busan { color: #3a7bd5 }` — style by `data-city` attribute or CSS variable
- ✅ Use generic class names + CSS custom properties driven by JS:
  ```css
  .city-dot { background: var(--city-color, var(--text-3)); }
  .city-label { color: var(--city-color, var(--text-2)); }
  ```
  Then in `app.js`:
  ```js
  el.style.setProperty('--city-color', city.color);
  el.dataset.city = city.id;
  ```

### 4. All user-visible text comes from `trip.meta.json → i18n`

- Every UI label that the user reads (tab names, button text, headings, empty states, error messages) lives in `trip.meta.json.i18n.{lang}.{key}`
- `app.js` exposes `t(key)` that resolves against `currentLang || trip.lang`
- Adding a new language = adding a new `i18n.{lang}` block. No code changes needed.

### 5. The `data/*.json` shards carry everything dynamic

| Shard | Contains |
|-------|----------|
| `trip.meta.json` | `lang`, `supportedLangs`, `destination`, `tagline`, `startDate`, `endDate`, `currency`, `cities[]`, `i18n` |
| `pois.json` | POI array |
| `schedule.json` | day-by-day events |
| `weather.json`, `budget.json`, `booking.json`, `checklist.json` | matching domain data |
| `flightIntel.json`, `entryRequirements.json`, `entryForms.json`, `holidays.json`, `retro.json` | optional |

The schema (see [trip-json-schema.md](trip-json-schema.md)) is authoritative. New fields needed for a feature → schema first, then `app.js` consumes it. Never bypass JSON to "just hardcode this one thing".

---

## What Goes Where

| Concern | `index.html` (incl. `<style>`) | `app.js` | `data/*.json` |
|---------|:------------------------------:|:--------:|:-------------:|
| Layout structure | ✓ | | |
| Visual design tokens | ✓ (CSS vars in `<style>`) | | |
| Render logic | | ✓ | |
| Trip text (names, descriptions, taglines) | ✗ | ✗ | ✓ (nested i18n objects) |
| Trip data (POIs, schedule, budget, weather) | ✗ | ✗ | ✓ (per-shard) |
| City colors | use `var(--city-color)` | set CSS var from JSON | `trip.meta.cities[].color` |
| UI translations (tab labels, buttons) | ✗ | use `t(key)` | `trip.meta.i18n.{lang}.{key}` |
| Currency formatting rules | ✗ | ✓ generic logic | `trip.meta.currency.home`, `currency.rates` |

---

## `trip.meta.json` Top-Level Fields

```json
// Single-language mode (DEFAULT — match the user's conversation language)
{
  "lang": "zh",
  "supportedLangs": ["zh"],
  "destination": "Sydney",
  "tagline": { "zh": "海岸步道、藍山秘境、與港邊跨年煙火" },
  "startDate": "2026-12-26",
  "endDate": "2027-01-01",
  "currency": { "home": "TWD", "rates": { "AUD": 0.0465 } },
  "cities": [
    { "id": "sydney", "name": { "zh": "雪梨" }, "color": "#0aa8c2", "icon": "location_city" },
    { "id": "bluemountains", "name": { "zh": "藍山" }, "color": "#2e7d32", "icon": "landscape" }
  ],
  "i18n": {
    "zh": {
      "tab.today": "今日",
      "tab.spots": "景點",
      "tab.calendar": "行程",
      "tab.budget": "預算",
      "tab.booking": "訂購",
      "tab.checklist": "清單",
      "label.total": "總計",
      "label.booked": "已預訂",
      "empty.no_events": "今天沒有安排"
    }
  }
}
```

- `lang` — the user's conversation language (also the default display language)
- `supportedLangs` — defaults to `[lang]`. Multi-lang is opt-in (user explicitly asks for it). The language switcher hides when there's only one entry.
- `i18n` — every UI string keyed by ID, only under the supported langs. Phase 5 generator emits these once per trip; `app.js` consumes via `t(key)`
- `cities` — replaces hardcoded `wd-city-*` CSS rules. Each city carries its color and icon. `app.js` injects the color as a CSS variable on the element.

---

## Validation Checklist (Phase 5 Generator MUST Run)

Before finalizing the output folder, the generator validates:

1. `grep -E "(busan|tokyo|fukuoka|釜山|福岡|東京|TWD|KRW|JPY)" index.html app.js` returns **empty** (style.css doesn't exist).
2. `index.html` `<title>` is a generic placeholder (or `data-i18n="meta.title"`).
3. No `<script id="trip-data">` block in `index.html`.
4. **No `style.css` file exists** — validator's `no-style-css` rule blocks this.
5. The 6 required CDN tags exist in `<head>`: Tailwind, Leaflet JS, Leaflet CSS, Google Fonts, Noto+Sans+TC, Material+Symbols+Outlined.
6. Every user-visible string in `app.js` either:
   - is a key passed to `t(...)`, OR
   - is read from a `TRIP.*` field
7. No `WEATHER_DATA`, `POIS`, `SCHEDULE`, `NOMAD_SPOTS`, `SCHEDULE_CITY_I18N` literal arrays in `app.js`.
8. No CSS rules matching `.wd-city-{name}` or any city-named selector inside the `<style>` block. Use `[data-city]` attribute selectors or CSS variables instead.
9. The `<style>` block contains no trip-specific tokens.

If any check fails: regenerate the offending file. Don't ship a violating template. The validator (`scripts/validate-trip.mjs`) enforces these automatically.

---

## Why This Matters

- **Re-skinning a trip = swap shards.** The user can update the trip plan by editing one or two JSON shards; HTML/JS untouched.
- **Future trips reuse the same shell.** No duplication of layout work per trip.
- **Sharded layout makes Phase 5 generation 5–10× faster** — each shard is one `Write` instead of many `Edit` calls on a single growing JSON.
- **i18n is decoupled from rendering.** Single-lang is the default. Opting into Korean for a Japan trip = add `"ko"` to `supportedLangs`, add an `i18n.ko` chrome block in `trip.meta.json`, and add a `"ko"` key inside each existing nested i18n object (e.g. `"name": { "zh": "釜山", "ko": "부산" }` in `pois.json`). No code change.
- **The `update an existing plan` flow** (`trip-mutator` skill) becomes trivial: edit the relevant shard, reload page.
