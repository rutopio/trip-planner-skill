---
name: cdn-and-styling
description: External dependency policy and CSS minimization rules for the generated trip site
---

# CDN & Styling Policy

The generated trip site uses **CDN-hosted libraries** for everything visual and interactive. Custom CSS is the exception, not the default.

---

## Required CDN Dependencies (load in `<head>`)

These three CDN tags are MANDATORY in every generated `index.html`:

```html
<!-- 1. Tailwind CSS — utility-first styling. Cuts custom CSS by ~90%. -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- 2. Google Fonts — unified multi-script font + Material Symbols icons. -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400..700,0..1,-50..200&display=swap">

<!-- 3. Leaflet — interactive map. CartoDB Voyager tiles, NOT raw OSM (403). -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

Use these exact URLs and versions. Do NOT pin Tailwind to an older CDN — `cdn.tailwindcss.com` is the v3 JIT runtime; it ships fresh utilities on every page load.

---

## Styling Decision Tree

**No external `style.css`.** The generated trip folder does NOT contain a `style.css` file. All custom CSS is inlined in a `<style>` block inside `index.html` (already present in the canonical `index-skeleton.md`).

For every visual element, ask in this order:

```
1. Can a Tailwind utility do it?           → use Tailwind class in HTML
2. Is it design-token-driven (color, font, → use the CSS variable already
   spacing, radius)?                          declared in :root (e.g. var(--accent))
3. Is it style-pack specific (the chosen   → override CSS variables in :root via
   Phase-4.5 UI style)?                       the same <style> block in index.html
4. Otherwise                               → DO NOT write CSS
```

**Default to Tailwind classes.** Custom CSS only exists in the small `<style>` block already in `index-skeleton.md` — do NOT extend that block unless you genuinely hit one of the exceptions below.

---

## What Lives in the `<style>` Block (and only here)

The `<style>` block in `index.html` (provided verbatim by `index-skeleton.md`) contains exactly:

1. **CSS variables** in `:root` — design tokens (`--bg`, `--text`, `--accent`, `--r`, `--font`, `--city-color`, etc.). The UI-style pack overrides these by emitting a fresh `:root { ... }` rule.
2. **Calendar absolute-positioning math** — the 60px/hour grid, now-line indicator. Tailwind can't do `top: calc(60px * var(--n))`.
3. **Cover/Today overlay transitions** — `transform: translateY(-100vh)` with `transition`. Bespoke trip animations.
4. **Leaflet overrides** — `.leaflet-popup-content`, `.leaflet-container { font-family }`. Tailwind can't reach Leaflet's internal DOM.
5. **`@media print`** — hides nav/buttons for print-friendly mode.
6. **Pure-CSS horizontal bar chart** — `.h-bar { width: var(--pct) }`. Needs CSS variables, not Tailwind utilities.

That's it. Everything else uses Tailwind utilities directly in HTML markup.

---

## UI-Style Pack Application (no separate file)

When the user picks a UI style (e.g. Botanical, Luxury Editorial), the generator does NOT write a `style.css`. Instead it modifies the existing `<style>` block in `index.html`:

1. **Override CSS variables** — replace the `:root { --r, --bg, --accent, ... }` values with the style pack's tokens.
2. **Override Tailwind config** — replace the `tailwind.config = { ... }` script block in `<head>` with the style pack's `theme.extend`.
3. **Append style-pack signature CSS** — neo-brutalism's hard shadows, neumorphism's inset shadows, etc. — at the END of the `<style>` block. Keep this minimal (under 50 lines).

---

## Forbidden Custom-CSS Patterns

Stop writing CSS for these — Tailwind handles them all in HTML markup:

- ❌ Padding, margin, gap (`.p-4`, `.mx-auto`, `.gap-3`)
- ❌ Flexbox / grid layout (`.flex items-center justify-between`, `.grid grid-cols-3`)
- ❌ Typography weight, size, line-height (`.text-lg font-semibold leading-relaxed`)
- ❌ Generic borders, rounded corners (`.border rounded-2xl`)
- ❌ Hover/focus/active states (`.hover:bg-slate-100 focus:ring-2`)
- ❌ Responsive breakpoints (`md:grid-cols-2 lg:grid-cols-3`)
- ❌ Common transitions (`.transition-all duration-300`)
- ❌ Standard shadows (`.shadow-md shadow-lg`)
- ❌ Color utilities (`.bg-white text-slate-900`)

**If a generated trip contains a `style.css` file at all, that's a bug.** Delete the file and either move the content into the `<style>` block or convert to Tailwind utilities.

---

## Tailwind Theme Extension (recommended)

Put trip-specific tokens into Tailwind's theme so they're available as utilities throughout HTML:

```html
<script>
  tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          sans: ['"Noto Sans TC"', '"Noto Sans JP"', '"Noto Sans KR"', '-apple-system', 'system-ui', 'sans-serif'],
        },
        colors: {
          // Cities are dynamic — set via CSS var, not Tailwind. See injectCityVars().
          accent: 'var(--accent)',
          ink: 'var(--text)',
          paper: 'var(--bg)',
        },
        borderRadius: {
          DEFAULT: 'var(--r)',
        },
      },
    },
  };
</script>
```

Now `class="font-sans bg-paper text-ink rounded"` works directly in markup, picking up CSS vars set by the UI-style pack.

---

## Material Symbols (icons)

Use Material Symbols Outlined for ALL icons. Loaded from the Google Fonts CDN above (in the same `<link>` tag).

```html
<span class="material-symbols-outlined text-xl">flight</span>
<span class="material-symbols-outlined text-base text-slate-500">restaurant</span>
```

Do NOT use emoji except for country flags (passport-related contexts only). All other "icon-like" needs go through Material Symbols.

---

## Map: Leaflet + CartoDB Voyager (NOT raw OSM)

Already mandated by `app-skeleton.md`. Repeat here for reference:

```js
window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  subdomains: 'abcd',
  maxZoom: 20,
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
}).addTo(map);
```

**Never** use `tile.openstreetmap.org` directly — it returns 403 to browser CDN traffic.

---

## File-Size Sanity Check

Targets (rough — UI style packs vary):

| File | Typical | Red flag |
|------|---------|----------|
| `index.html` | 220–280 lines (incl. ~60-line `<style>` block) | > 400 lines → inline trip data or runaway custom CSS |
| `app.js` | 1500–3000 lines | > 4000 lines → render redundancy |
| `data/*.json` shards (combined) | 1500–4000 lines | depends on trip length |
| `style.css` | **DOES NOT EXIST** | **Any `style.css` file is a bug — move content into the `<style>` block in index.html** |

If the `<style>` block inside `index.html` exceeds 200 lines, audit it: most likely you wrote utility CSS that should be Tailwind utilities in the markup instead.
