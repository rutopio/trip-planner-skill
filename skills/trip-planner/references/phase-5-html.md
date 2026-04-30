# Phase 5 — Generate the HTML (Free-Form, Single File)

Write ONE self-contained `index.html` directly from Phase 1–4 conversation context. No JSON, no schema, no placeholders, no maintenance scaffolding. This is a static one-shot website — write it like you'd write a magazine article, not a CMS.

---

## Output Path

```
{pwd}/{destination-slug}-{year}/index.html
```

- `{pwd}` = current working directory at invocation. Capture with one `pwd` call. No `~`, no `$HOME`, no invented parents.
- `{destination-slug}` = lowercase ASCII, hyphenated. `kyoto`, `busan-fukuoka`, `hokkaido`.
- `{year}` = 4-digit start year.

**Before any `mkdir`:** run `pwd`, build the path, confirm with the user once:
> "I'll generate the trip into `/abs/path/{slug}-{year}/index.html`. OK?"

Then `mkdir -p {abs-path}` and proceed.

---

## Visual Style (Fixed — Do Not Ask)

The aesthetic is locked: **modern shadcn / Vercel / Next.js look**. No style picker, no restyle offer.

Reference points:
- shadcn/ui component library
- vercel.com marketing pages
- nextjs.org docs

Concrete tokens (use these directly in Tailwind classes or in the `<style>` block):

| Token | Value |
|-------|-------|
| Font (sans) | `Inter`, fallback `system-ui, sans-serif` (Google Fonts) |
| Font (display, optional) | `Geist` or `Inter` tighter weight |
| Background | `bg-white` / `bg-zinc-50` for sections |
| Foreground | `text-zinc-900` |
| Muted text | `text-zinc-500` / `text-zinc-600` |
| Border | `border-zinc-200` (1px) |
| Card | `bg-white border border-zinc-200 rounded-xl shadow-sm` |
| Accent | `text-zinc-900` on hover, **no bright brand color** — neutral palette throughout |
| Radius | `rounded-lg` / `rounded-xl` (8–12px) |
| Spacing | Generous whitespace: `py-12` `gap-8` for sections |
| Typography scale | `text-4xl font-semibold tracking-tight` (h1), `text-2xl` (h2), `text-base` (body) |
| Dark mode | Optional, only if trivial — `dark:bg-zinc-950 dark:text-zinc-100`. Skip if it adds complexity. |

**Vibe**: clean, neutral, document-like, calm. Not playful, not loud, not cute. Subtle hover states, soft shadows, plenty of breathing room.

---

## Core Principle: Write Content as HTML, Not as Data

**Every attraction name, price, address, schedule entry, budget figure goes into the markup directly.** Not into a JS object, not into a JSON file. Just plain HTML in the user's language.

```html
<!-- yes -->
<article class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
  <h3 class="text-xl font-semibold tracking-tight">札幌雪祭 (Sapporo Snow Festival)</h3>
  <p class="mt-1 text-sm text-zinc-500">2026-02-04 〜 02-11 · 大通公園 · 入場無料</p>
  <p class="mt-3 text-zinc-700">世界三大雪祭之一,巨型雪雕、夜間燈光秀。建議傍晚 17:00 後造訪,雪雕點燈最美。</p>
  <a href="https://www.snowfes.com/" class="mt-3 inline-block text-sm underline underline-offset-4 hover:text-zinc-900">官方網站</a>
</article>

<!-- no — this is the old JSON-driven world we just retired -->
<article id="poi-1"></article>
<script>const POIS = [{id:1, name:'札幌雪祭', ...}]; renderPOIs(POIS);</script>
```

The only place `<script>` content is acceptable: **tab-switcher click handlers** and an **optional currency toggle** that reads `data-cost` / `data-currency` attributes. Everything else is markup.

---

## Generation Strategy: Write + Edit Append

Use the `Write` tool for the first block, then `Edit` (appending to the end of the file) for each subsequent block. No `cat`, no heredocs, no shell commands.

### Step 1 — `Write` the head + body opening

One `Write` call produces the full `<head>` and opening `<body>` structure:
- `<!doctype html>` and `<html lang="{user-lang-code}">`
- `<head>` with `<meta>`, `<title>`, and the allowed CDN tags: **Tailwind CSS + Google Fonts (Inter) + Leaflet CSS/JS** (and any other CDN strictly required by a feature actually in use).
- Minimal inline `<style>` block — only what Tailwind utilities can't do (custom CSS variables for tokens, Leaflet container sizing, `@media print` rules if useful).
- `<body class="bg-white text-zinc-900 antialiased">`, `<header>`, `<nav>` (sticky tab row)

**CDN tags (Tailwind + Google Fonts + Leaflet are baseline):**

```html
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
```

Inline `<style>`:

```css
:root { font-family: 'Inter', system-ui, sans-serif; }
#map { height: 480px; border-radius: 12px; border: 1px solid rgb(228 228 231); }
```

### Step 2 — `Edit` to append each content block

For each block, use `Edit` with `old_string` set to the last line already in the file and `new_string` replacing it with that line plus the new block. Keep each block under 500 lines; split further if needed.

Block order:
1. Cover + Overview (title hero, today card, weather, quick stats)
2. Schedule (day-by-day timeline)
3. Spots (Leaflet map + POI cards)
4. Booking (flights, hotels, passes, holiday calendar)
5. Budget (breakdown table)
6. Checklist (todos, entry forms as `<details>`)

### Step 3 — `Edit` to append the `<script>` block

Three things only — tab switcher, optional currency toggle, Leaflet map bootstrap. The marker array is inlined here (one entry per POI: `{name, day, lat, lng, why, mapsUrl, anchor}`) — that's the only place POI data appears in JS, and it exists *because* Leaflet needs lat/lng programmatically; everything else stays in markup.

```html
<script>
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      document.getElementById(btn.dataset.tab)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const toggle = document.getElementById('currency-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      document.querySelectorAll('[data-cost]').forEach(el => {
        const cur = el.dataset.currency;
        const next = cur === 'home' ? 'dest' : 'home';
        el.textContent = el.dataset[next + 'Display'];
        el.dataset.currency = next;
      });
    });
  }

  const POI_MARKERS = [
    // { name: '清水寺', day: 1, lat: 34.9949, lng: 135.7850, why: '...', mapsUrl: '...', anchor: '#poi-kiyomizu' },
  ];
  const dayColors = ['#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
  if (POI_MARKERS.length && document.getElementById('map')) {
    const map = L.map('map');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
    }).addTo(map);
    const group = L.featureGroup();
    POI_MARKERS.forEach(p => {
      L.circleMarker([p.lat, p.lng], {
        radius: 8, color: dayColors[(p.day-1) % dayColors.length],
        fillColor: dayColors[(p.day-1) % dayColors.length], fillOpacity: 0.85, weight: 2
      })
      .bindPopup(`<strong>${p.name}</strong><br>Day ${p.day} · ${p.why}<br><a href="${p.mapsUrl}" target="_blank">Google Maps</a>`)
      .addTo(group);
    });
    group.addTo(map);
    map.fitBounds(group.getBounds().pad(0.15));
  }
</script>
```

### Step 4 — `Edit` to append closing tags

Append `</body></html>` as the final edit.

### Step 5 — Stop

**Do not run any verification command that launches a server or opens a browser.** Do not run `python3 -m http.server`, do not run `open index.html`, do not deploy. The file is final. Reply with one short line stating the absolute path:

> "Done. File at `/abs/path/{slug}-{year}/index.html` — open it in your browser."

(in the user's conversation language). The user will open it themselves. `file://` works because everything is inline (Tailwind + Google Fonts CDN load fine over HTTPS from a local file).

---

## What NOT to Build (No-Maintenance Mode)

This is a **static one-shot artefact**. The user will look at it on the trip and never touch it again. Aggressively cut anything that exists for "future maintenance":

- ✅ **Interactive map IS required.** Use Leaflet + OpenStreetMap tiles, one marker per POI, popup with name + one-line why + "Open in Google Maps" link. Keep it lean: no marker-clustering plugin, no heatmaps, no draw tools — markers and popups only.
- ❌ **No localStorage expense tracker.** Show the estimated budget as a static table. If the user wants to track real spending, that's their phone's notes app.
- ❌ **No localStorage cover photo upload.** Either embed a base64 image inline if the user provided one, or skip the hero image.
- ❌ **No "edit mode" toggles.** No drag-to-reorder. No add-attraction buttons.
- ❌ **No i18n object, no `t()` function, no language switcher.** Write every visible string in the user's language directly into the markup.
- ❌ **No `const TRIP = {...}` god-object.** Data goes in markup.
- ❌ **No JSON shards, no `data/*.json`, no `fetch()`.**
- ❌ **No service workers, no PWA manifest, no offline cache logic.** A single file already works offline by definition.
- ❌ **No analytics, no telemetry.**
- ❌ **No deployment helpers** (no `serve.py`, no README, no `.gitignore`). The user opens `index.html` directly.

If you find yourself thinking "but what if the user wants to update X later" — they'll ask Claude to regenerate. That's cheaper than carrying maintenance scaffolding in every trip.

---

## Content Requirements (pull from conversation context, not invent)

### Header / Cover
Trip title in user's language, date range, total days, party size, optional tagline (one poetic line from Phase 3). Use a large `text-5xl font-semibold tracking-tight` heading on a `bg-zinc-50` hero section.

### Overview
Cities visited (small pill badges), today card (auto-detect via `new Date()` rendered server-side as a static "X days to go" or "Day Y of Z" — write the current state at generation time), weather strip (Phase 4 weather data, written as static `<dl>` or card grid), quick stats: POI count, estimated total budget, flight booked y/n.

### Schedule
One block per day: date, weekday, city, then events with time, type icon (use Unicode emoji or inline SVG — no icon library), name, address, price. All written as HTML — no JS rendering loop. Use a vertical timeline layout: `border-l border-zinc-200` with bullets.

### Spots
List of POIs from Phase 2 + Phase 4 as a responsive card grid. Each POI = `<article>` with name (local + transliterated), category badge, address, hours, price, one-line "why", official URL, and an "Open in Google Maps" link (in the user's language) pointing to `https://www.google.com/maps/search/?api=1&query=...`. **Plus an embedded Leaflet map** at the top of this section showing all POIs as markers, color-coded by day, popup linking back to the matching card via anchor (`#poi-{slug}`).

### Booking
Flights (booked card OR Phase 1.5 recommendation table), hotels (booked card OR area suggestions), city passes/day tours from Phase 4, destination's holiday calendar for the trip month.

### Budget
Estimated breakdown table from Phase 1 budget answers. Two columns: destination currency + home currency. Each `<td>` carries `data-cost="{amount}"`, `data-currency="home"`, `data-home-display="NT$..."`, `data-dest-display="¥..."` so the optional toggle can swap them — but the page works fine without that toggle.

### Checklist
Pre-trip todos (passport, eSIM, transit card, charger), entry forms as `<details>` elements with form name as `<summary>` and pre-filled field tables inside, day-of reminders.

---

## Hard Rules

- **One file: `index.html`.** No companions, no `serve.py`, no `README.md`, no folder structure beyond `{slug}-{year}/index.html`.
- **Monolingual** in the user's conversation language.
- **Real data only** — every price, hour, address from Phase 4 research. Unknown → render a "check on arrival" badge in the user's language (e.g. "現場確認" for zh-TW, "현장 확인" for ko, "確認" for ja).
- **Real URLs only.**
- **CDN allowed:** Tailwind CSS, Google Fonts (Inter), Leaflet (CSS + JS). Other CDNs only if a feature in scope strictly requires them — no chart libs / icon libs "just in case".
- **Each `Write` / heredoc append < 500 lines.** Above that, tool calls stall.
- **Search in destination's local language** during research — see [search-language-rules.md](search-language-rules.md).
- **JS stays minimal** — tab switcher, optional currency toggle, and the Leaflet bootstrap (init + inlined marker array from POI lat/lng + popups). No render loops over a TRIP god-object, no framework, no state management, no localStorage.
- **Visual style is fixed.** shadcn / Vercel / Next.js aesthetic. Never ask the user about style.
- **Stop after the file is written.** No server launch, no `open`, no deploy. One short reply with the absolute path. The user opens the file.
