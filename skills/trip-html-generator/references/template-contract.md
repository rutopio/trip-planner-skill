# Template Contract — `trip.json` Is the Single Source of Truth

**Goal:** every generated trip uses the **same** `index.html`, `style.css`, `app.js`. Only `data/trip.json` changes per trip. The HTML is a dumb shell — it knows nothing about Tokyo, Busan, KRW, or "🌸". All trip-specific content is rendered from JSON at runtime.

This contract is **mandatory**. The Phase 5 generator (`trip-html-generator`) MUST NOT violate it.

---

## The Rules

### 1. `index.html` contains ZERO trip-specific strings
- ❌ No destination names ("Busan", "Tokyo")
- ❌ No prices, dates, attraction names, restaurant names
- ❌ No tagline, no hotel names, no flight numbers
- ❌ No city-specific emoji or icons
- ✅ Only structural markup: tab containers, empty `<div>` mounts, layout scaffolding
- ✅ The `<title>` is a generic placeholder (e.g., "Trip Plan") — `app.js` updates it from `trip.json` on load
- ✅ Inline `<script id="trip-data" type="application/json">…</script>` exists, but it carries the trip JSON for `file://` fallback — it is **the same JSON** as `data/trip.json`, not a hand-edited variant

### 2. `app.js` contains ZERO trip-specific strings or per-trip CSS classes
- ❌ No hardcoded city keys (`busan`, `aso`, `fukuoka`)
- ❌ No hardcoded ternary i18n: `isZh ? '中文' : 'English'` — use `t('key')`
- ❌ No `WEATHER_DATA = [...]` literal arrays. Read `trip.weather` from JSON.
- ❌ No CSS class names tied to specific cities (e.g., `wd-city-busan`)
- ✅ All rendering is data-driven. To color a city marker, read `city.color` from JSON; apply via inline `style` or CSS variables.
- ✅ Translation strings for UI chrome (tab labels, "Total", "Today", "Booked") live in `trip.i18n` — keyed lookup via `t(key, lang)`.

### 3. `style.css` contains ZERO trip-specific selectors
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

### 4. All user-visible text comes from `trip.json` `i18n` strings
- Every UI label that the user reads (tab names, button text, headings, empty states, error messages) lives in `trip.i18n.{lang}.{key}`
- `app.js` exposes `t(key)` that resolves against `currentLang || trip.lang`
- Adding a new language = adding a new `trip.i18n.{lang}` block. No code changes needed.

### 5. `data/trip.json` carries everything dynamic
The JSON schema (see [trip-json-schema.md](trip-json-schema.md)) is authoritative. New fields needed for a feature → schema first, then app.js consumes it. Never bypass JSON to "just hardcode this one thing".

---

## What Goes Where

| Concern | `index.html` | `style.css` | `app.js` | `trip.json` |
|---------|:------------:|:-----------:|:--------:|:-----------:|
| Layout structure | ✓ | | | |
| Visual design tokens | | ✓ | | |
| Render logic | | | ✓ | |
| Trip text (names, descriptions, taglines) | ✗ | ✗ | ✗ | ✓ |
| Trip data (POIs, schedule, budget, weather) | ✗ | ✗ | ✗ | ✓ |
| City colors | ✗ | use `var(--city-color)` | set CSS var from JSON | `cities[].color` |
| UI translations (tab labels, buttons) | ✗ | ✗ | use `t(key)` | `i18n.{lang}.{key}` |
| Currency formatting rules | ✗ | ✗ | ✓ generic logic | `currency.home`, `currency.rates` |

---

## `trip.json` Top-Level Additions for Template Contract

Beyond the existing schema, `trip.json` must include:

```json
// Single-language mode (DEFAULT — match the user's conversation language)
{
  "lang": "zh",
  "supportedLangs": ["zh"],
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
  },
  "cities": [
    { "id": "busan", "name": { "zh": "釜山" }, "color": "#3a7bd5", "icon": "beach_access" },
    { "id": "aso",   "name": { "zh": "阿蘇" }, "color": "#2e7d32", "icon": "landscape" }
  ]
}
```

- `lang` — the user's conversation language (also the default display language)
- `supportedLangs` — defaults to `[lang]`. Multi-lang is opt-in (user explicitly asks for it). The language switcher hides when there's only one entry.
- `i18n` — every UI string keyed by ID, only under the supported langs. Phase 5 generator emits these once per trip; `app.js` consumes via `t(key)`
- `cities` — replaces hardcoded `wd-city-*` CSS rules. Each city carries its color and icon. `app.js` injects the color as a CSS variable on the element.

---

## Validation Checklist (Phase 5 Generator MUST Run)

Before finalizing the output folder, the generator validates:

1. `grep -E "(busan|tokyo|fukuoka|釜山|福岡|東京|TWD|KRW|JPY)" index.html app.js style.css` returns **empty**
2. `index.html` `<title>` is a generic placeholder
3. Every user-visible string in `app.js` either:
   - is a key passed to `t(...)`, OR
   - is read from a `trip.*` field
4. No `WEATHER_DATA`, `POIS`, `SCHEDULE` literal arrays in `app.js` — only reads from `trip.weather`, `trip.pois`, `trip.schedule`
5. No CSS rules matching `.wd-city-{name}` or any city-named selector. Use `[data-city]` attribute selectors or CSS variables instead.

If any check fails: regenerate the offending file. Don't ship a violating template.

---

## Why This Matters

- **Re-skinning a trip = swap `trip.json`.** The user can update the trip plan by editing JSON only; HTML/CSS/JS untouched.
- **Future trips reuse the same shell.** No duplication of layout work per trip.
- **i18n is decoupled from rendering.** Single-lang is the default. Opting into Korean for a Japan trip = add `"ko"` to `supportedLangs`, add an `i18n.ko` chrome block, and add a `"ko"` key inside each existing nested i18n object (e.g. `"name": { "zh": "釜山", "ko": "부산" }`). No code change.
- **The `update an existing plan` flow** (in trip-planner SKILL.md) becomes trivial: edit JSON, reload page.
