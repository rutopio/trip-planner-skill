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

For every visual element, ask in this order:

```
1. Can a Tailwind utility do it?           → use Tailwind class
2. Is it design-token-driven (color, font, → use CSS variable in <style> root
   spacing, radius)?
3. Is it style-pack specific (the chosen   → write minimal CSS in style.css
   Phase-4.5 UI style)?
4. Otherwise                               → DO NOT write CSS
```

**Default to Tailwind.** If you find yourself writing more than 5 lines of `style.css` for a single component, stop and ask: "could Tailwind classes do this?"

---

## When You MUST Write Custom CSS (the only exceptions)

`style.css` is allowed to contain:

1. **Tailwind config** — extending the theme via `<script>tailwind.config = { theme: { extend: { ... } } }</script>` in `<head>` (this lives in HTML, not style.css, but counts as theme setup).
2. **CSS variables** in `:root` — design tokens: `--text`, `--bg`, `--accent`, `--city-color`, `--font`, `--r` (radius), spacing scale. The Phase 5 generator emits these from the chosen UI style.
3. **Component CSS that Tailwind genuinely cannot do**:
   - Leaflet popup overrides (`.leaflet-popup-content`, etc.) — Tailwind can't reach into Leaflet's DOM
   - Custom animations / `@keyframes` — Tailwind has some, but trip-specific (cover slide-up, today slide-down, now-line pulse) are bespoke
   - `@media print` rules for the print-friendly mode
   - Pure-CSS bar charts (the budget breakdown bars) — needs precise `width: var(--pct)` calculations
   - Calendar grid time-slot positioning (60px/hour math, now-line absolute positioning)
4. **The chosen UI style pack's distinctive treatment** — e.g., neo-brutalism's hard shadows, neumorphism's inset shadows, terminal's CRT scanlines. The `ui-style` skill provides the CSS to copy.

That's it. **Everything else is Tailwind.**

---

## Forbidden Custom-CSS Patterns

Stop writing CSS for these — Tailwind handles them all:

- ❌ Padding, margin, gap (`.p-4`, `.mx-auto`, `.gap-3`)
- ❌ Flexbox / grid layout (`.flex items-center justify-between`, `.grid grid-cols-3`)
- ❌ Typography weight, size, line-height (`.text-lg font-semibold leading-relaxed`)
- ❌ Generic borders, rounded corners (`.border rounded-2xl`)
- ❌ Hover/focus/active states (`.hover:bg-slate-100 focus:ring-2`)
- ❌ Responsive breakpoints (`md:grid-cols-2 lg:grid-cols-3`)
- ❌ Common transitions (`.transition-all duration-300`)
- ❌ Standard shadows (`.shadow-md shadow-lg`)
- ❌ Color utilities (`.bg-white text-slate-900`)

If your `style.css` contains any of these patterns, delete that block and convert to Tailwind classes in HTML.

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
| `index.html` | 200–400 lines | > 600 lines suggests inline data leakage |
| `app.js` | 1500–3000 lines | > 4000 lines suggests render redundancy |
| `style.css` | **50–200 lines** | **> 400 lines means you're not using Tailwind enough** |
| `data/trip.json` | 1500–4000 lines | depends on trip length |

If `style.css` exceeds 400 lines, audit it: most likely you wrote utility CSS that should be Tailwind classes in the HTML.
