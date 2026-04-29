### Layout Blueprint

The HTML structure: page shell, tab anatomy, design tokens, and the non-negotiable rules that survive every UI-style choice. Component-level rendering details (Today, Cover, Modal, Clocks, etc.) live in [components.md](components.md). CDN setup and styling policy live in [cdn-and-styling.md](cdn-and-styling.md). i18n rules live in [SKILL.md §Data Language Rule](../SKILL.md).

> **Implementation note:** Layout/spacing/typography examples in this doc are *intent specs*. Actual implementation uses **Tailwind utility classes** in HTML wherever possible. Custom CSS in `style.css` is reserved for the narrow exceptions in [cdn-and-styling.md](cdn-and-styling.md).

---

## Page Shell: Sidebar + Tab Panels

```
┌─────┬───────────────────────────────────┐
│ ▢   │  <main>                           │
│ ▢   │   ┌─────────────────────────────┐ │
│ ▢   │   │  active <section.tab-panel> │ │
│ ▣   │   │                             │ │
│ ▢   │   │                             │ │
│ ▢   │   └─────────────────────────────┘ │
│     │                                   │
│ ⓛ   │                                   │
└─────┴───────────────────────────────────┘
sidebar    main scrollable content
(desktop)
```

- Desktop: fixed left sidebar with 7 tab buttons + language switcher (hidden when single-lang). Min width 64px.
- Mobile: bottom bar with up to 4 visible tabs + "More" overflow. Hides on scroll-down (subtle).
- `<main>` is the only scroll container. Each tab is `<section class="tab-panel" id="tab-{id}">`. Toggling adds/removes `.active`.

---

## Tab Anatomy

| Tab id | Icon | Purpose | Required mount points |
|--------|------|---------|------------------------|
| `tab-attractions` | `travel_explore` | Trip summary + today card + weather strip | `#trip-destination` `#trip-meta` `#trip-tagline` `#stats-bar` `#info-box` `#time-countdown` `#today-card` `#weather-strip` |
| `tab-calendar` | `calendar_month` | Day grid (desktop) + list (mobile) + live clocks + now line | `#calendar-desktop` `#calendar-mobile` `#clock-dest` `#clock-home` |
| `tab-booking` | `sell` | Flights, hotels, tickets, passes, recommended buys | `#flight-intel` `#booking-purchased` `#booking-compare` `#booking-recommended` `#holiday-calendar` |
| `tab-budget` | `wallet` | Estimated/actual toggle, charts, line items | `#budget-mode-toggle` `#budget-total` `#budget-by-city` `#budget-by-cat` `#budget-detail` |
| `tab-time` | `map` | Spots — filters + Leaflet map + POI list | `#poi-filters` `#map` `#poi-list` |
| `tab-checklist` | `checklist` | Entry forms + checklist + nomad spots | `#entry-forms` `#checklist-groups` `#nomad-workspaces` |
| `tab-retro` | `auto_stories` | Post-trip retrospective (hidden until `endDate`) | `#retro-map` `#retro-budget-review` `#retro-missed` `#retro-changelog` `#retro-lessons` |

Tab content rendering details live in [components.md](components.md) and [html-content-sections.md](html-content-sections.md).

---

## Design Tokens (CSS variables)

**Default style: Swiss Minimalist** — international typographic style, grid precision, red accent, **zero rounded corners**, Notion/Linear aesthetic. The shell ships with these tokens:

```css
:root {
  /* Color */
  --bg: #FAFAFA;
  --text: #0A0A0A;
  --muted: #71717A;
  --border: #E4E4E7;
  --accent: #DC2626;          /* Swiss red */
  /* Layout */
  --r: 0px;                   /* Swiss = 0 radius. Pills still use 999px directly. */
  --pad: 24px;                /* Section padding */
  --col-gap: 16px;
  /* Type */
  --font: 'Noto Sans TC', 'Noto Sans JP', 'Noto Sans KR', system-ui, sans-serif;
  /* Per-city color (set dynamically by injectCityVars) */
  --city-color: #6B7280;      /* Default fallback */
}
```

When the user opts into a different UI-style pack (after the trip is generated, see [phase-4_5-style-and-audit.md](../../trip-planner/references/phase-4_5-style-and-audit.md)), that pack overrides these tokens by rewriting `:root` in `style.css`. Swiss is the default because it pairs well with calendar/itinerary density.

Tailwind theme extension (in `<head>`, see [cdn-and-styling.md](cdn-and-styling.md)) re-exports these as `bg-paper`, `text-ink`, `bg-accent`, `rounded-DEFAULT`, `font-sans`. Use those utilities in markup; never hardcode hex values.

---

## i18n Completeness (MANDATORY)

**Single-language is the default.** A trip emits one language — the user's conversation language. Multi-lang is opt-in only. The shape rules below apply in both modes; only the number of keys per i18n object differs.

**One format only — nested i18n objects. Bare strings and flat-sibling keys (`name_en`, `desc_ko`) are FORBIDDEN.** The validator (`scripts/validate-trip.mjs`) blocks both.

```json
// Single-lang (default):
{ "name": { "zh": "釜山" }, "desc": { "zh": "海濱城市" } }

// Multi-lang (opt-in):
{ "name": { "zh": "釜山", "en": "Busan" }, "desc": { "zh": "海濱城市", "en": "Coastal city" } }
```

**Required nested-i18n fields** (non-exhaustive):

- Static chrome: every `data-i18n="key"` reads `trip.i18n.{lang}.{key}`.
- POI: `name`, `nameLocal`, `desc`, `addr`. Optional `dining.party_label`, `dining.seating`, `dining.tips_solo[]`.
- Schedule: `events[].name`, `events[].note`, `events[].restaurant`.
- Budget: `items[].name`, `actual_expenses[].name`.
- Checklist: `groups[].title`, `groups[].items[].label`.
- Entry forms: `entryForms[].title`, `fields[].label`. Plus `entryRequirements[].name`, `entryRequirements[].items[].task`.
- Booking: `purchased[].name`, `compare[].name`, `recommended[].name`, `passes[].name`, flight `depart.place` / `arrive.place`.
- Retro: `changelog[].description`, `changelog[].reason`, `changelog[].lesson`, `missed_pois[].reason`, `missed_pois[].suggestion`, `planning_lessons[]`, `budget_review[].note`.
- Holidays: `holidays.items[].name`.

**POI primary/secondary name logic:** `name` (translated) shows as primary, `nameLocal` (local-script) as secondary. The renderer just calls `L(poi.name)` and `L(poi.nameLocal)` — no per-language conditionals.

**`applyLang()` re-renders all dynamic content** in multi-lang mode (harmless in single-lang): `renderPOIs`, `renderCalendar`, `renderBudget`, `renderChecklist`, `renderEntryForms`, `renderNomadSpots`, `renderToday`, `updateClocks`, `renderOverviewExtras`, `renderRetro`.

---

## Responsive Breakpoints

| Breakpoint | Width | Treatment |
|-----------|-------|-----------|
| Mobile | `< 768px` | Bottom bar, single column, calendar list view, 16px content padding |
| Tablet | `768–1024px` | Sidebar visible, calendar week view at narrower columns |
| Desktop | `> 1024px` | Full sidebar, full calendar week view, side-by-side panels |

Use Tailwind responsive utilities (`md:`, `lg:`) directly in markup. Avoid writing `@media` rules in style.css unless animating or print.

---

## Non-Negotiable Design Rules

These survive every UI-style choice. Style packs cannot override them.

1. **NO hero banner** — no top splash image, no hero `<img>`. Page starts with a compact h1 + meta + desc.
2. **Stats bar is inverted** — black bg + white text, immediately after the header.
3. **Cards have border-radius `var(--r)`** — defaults 0 (Swiss). UI-style packs may set this to 24px (Botanical, Organic) or other values when the user opts in.
4. **Chips are pills** (`rounded-full`), never rectangles.
5. **Vibrant color appears only in category indicators** — UI chrome is neutral.
6. **Hover is subtle** — border or shadow change, never color change.
7. **View switchers use pill groups**, not tabs/dropdowns.
8. **Budget items are list rows**, never an HTML `<table>`.
9. **Calendar uses 60px per hour** consistently.
10. **All monetary values get a `data-cost` attribute** (used by currency-switcher JS).
11. **Map: Leaflet + CartoDB Voyager basemap.** Tile URL: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png` with `subdomains:'abcd'`. **Never use `tile.openstreetmap.org`** — returns 403 in browsers. Validator blocks it.
12. **No floating elements** — no FAB, no floating chat, no sticky banners.
13. **Chart bars must have visible color** — `--chart-bar` ≥ `#888`. Time-allocation bars use category colors.
14. **Mobile padding mandatory** — content sections (charts, h-bars, cat-grid, items-table, section-labels) need `padding: 0 16px` on mobile.
15. **Category breakdown uses horizontal bars** (`.h-bars`/`.h-bar-row`), not card grids — saves vertical space.
16. **Expenses tab has no checkboxes** — plain rows. Estimated/Actual toggle. Actual mode groups items by `city` and date; pre-purchased items group separately.
17. **Cover page is MANDATORY.** Default dark gradient background (`#1a1a2e`). Upload via top-right camera button persists in `localStorage['trip-cover-photo']`. See [components.md §Cover Page](components.md).
18. **Live clocks on Calendar tab** — destination time (primary inverted) + home time (secondary). 30s update. See [components.md §Live Clocks](components.md).
19. **Now line on Calendar** — red `#e8664a` line with destination-timezone label (e.g., "14:32 JST"). Position = `(nowHour - HOUR_START) * 60` px. 30s update.
20. **Time allocation is computed from `schedule`** — never hardcode. Iterate `TRIP.schedule[].events[]`, sum durations per category and city.
21. **Language switcher** auto-hides when `TRIP.supportedLangs.length <= 1`. See [SKILL.md §Required Languages](../SKILL.md).
22. **Booked flight cards** show outbound + return in one card with timezone-corrected duration. Flight duration MUST be computed via UTC, not naive local-time subtraction. See [components.md §Booking Tab: Flight Card](components.md).
23. **Mobile POI click → scroll to map** — after `focusPOI()`, call `document.getElementById('map').scrollIntoView({behavior:'smooth', block:'start'})` when `window.innerWidth <= 900`.
24. **Pre-trip todo items are context-aware:**
    - `todo_charger`: specify exact plug type for destination (e.g., "Korea: Type C/F", "Japan: same as TW, no adapter").
    - `todo_checkin`: clickable link to airline's Web Check-in + window timing.
    - `todo_cash`: mention relevant currency + approximate amount.
25. **Layering order:** Today overlay (z:201) → Cover (z:200) → Main app → POI modal (z:300). See [components.md §Layering Order](components.md).
26. **No emoji except country flags** in passport/entry-requirement contexts. Everything else uses Material Symbols Outlined.
27. **No dark mode toggle, no FAB, no print-mode floating button.** Print is `@media print` rules only.

---

## Validator Coverage

The validator (`scripts/validate-trip.mjs`) automatically enforces rules 11, 21, 25 (placement/CDN), shell purity (no trip strings in HTML/CSS/JS), i18n shape, mount-point presence, map placement, and forbidden module-scope arrays. Other rules are author discipline.
