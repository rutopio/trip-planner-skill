### Layout Blueprint

This section is the **complete specification** for the HTML you generate. Follow it precisely to
produce a consistent, high-quality output every time. The design follows a **clean, minimal,
calendar-app aesthetic** — NOT a travel blog hero layout.

> **Implementation note:** All layout/spacing/typography/color examples in this doc that show CSS-rule snippets are *intent specs*, not implementation requirements. The actual implementation should use **Tailwind utility classes** in HTML wherever possible. Custom CSS in `style.css` is reserved for the narrow exceptions in [cdn-and-styling.md](cdn-and-styling.md) — design tokens, Leaflet overrides, animations, calendar grid math, and the chosen UI-style pack's distinctive treatment.

#### Page Shell: Sidebar + Tab Panels

The page is a flex row: fixed left sidebar (desktop) or fixed bottom bar (mobile), plus a
scrollable main content area. Each tab is a `<div class="tab-panel">` toggled via JS.

```
<body>  ← display:flex; min-height:100vh
├── <nav class="sidebar">  ← fixed left, 60px wide, icon-only nav
│   ├── tab buttons (.sb) — one per tab, active state fills black (NO logo/globe icon)
│   ├── spacer (flex:1)
│   └── utility buttons (print)
├── <div class="bottom-bar">  ← fixed bottom, mobile only (display:none on desktop)
│   ├── <div class="bottom-bar-inner"> — flex row of .bb buttons (max 5)
│   │   Order: Overview | Itinerary | Booking | Spots | More
│   └── <div class="bb-more-menu"> — popup menu for overflow tabs (Budget, Checklist, Language)
└── <div class="main">  ← flex:1, margin-left:60px, padding:32px 40px, max-width:1300px
    ├── <div class="tab-panel active" id="tab-attractions">  ← OVERVIEW tab (first tab)
    ├── <div class="tab-panel" id="tab-calendar">
    ├── <div class="tab-panel" id="tab-booking">  ← ticket price comparison tab
    ├── <div class="tab-panel" id="tab-budget">
    ├── <div class="tab-panel" id="tab-time">  ← SPOTS/MAP tab (filters + map + POI list)
    ├── <div class="tab-panel" id="tab-checklist">
    └── <div class="tab-panel" id="tab-retro">  ← post-trip retrospective (hidden until trip ends)
```

**Sidebar icons (top to bottom):** `travel_explore` (Overview) → `calendar_month` → `sell` → `wallet` → `map` (Spots) → `checklist`
**Bottom bar (left to right):** `travel_explore` (Overview) → `calendar_month` (Itinerary) → `sell` (Booking) → `map` (Spots) → `more_horiz` (More)
**More menu:** Budget (`wallet`) → Checklist (`checklist`) → Language (`translate`)

**Tab switching guard:** `showTab(id)` must check if the tab is already active and return early to prevent re-render and scroll:
```js
function showTab(id) {
  var currentPanel = document.querySelector('.tab-panel.active');
  if (currentPanel && currentPanel.id === 'tab-' + id) return;
  // ... rest of tab switching logic
  window.scrollTo(0, 0);
}
```

#### 6 Tabs and Their Layouts

**Tab 1: Overview (id=tab-attractions)** — the landing page with trip summary + today's plan
```
├── .hdr (flex row: .hdr-left with h1 + meta + desc, .hdr-right with export button)
│   NOTE: NO hero banner image. Starts directly with compact h1 + meta text.
├── .stats (4-col grid, inverted black bg, white text)
│   └── .st (label → big number → subtitle) × 4
│       Stats bar shows ACTUAL spending, NOT estimates:
│       - "Total Spent" (actual) — sum of all actual_expenses + purchased items.
│         If no actual data yet (pre-trip), show "–"
│       - "POI Count" — number of attractions
│       - "Daily Avg" (actual) — total actual spend ÷ trip days (excl. flights/hotel).
│         If no actual data yet, show "–"
│       - "Work Days" (if nomad mode) or other relevant stat
│       Pre-trip fallback: before any actual expenses are logged, display "–" for
│       monetary values. Once actual_expenses has data, compute from real numbers.
├── .info-box (cherry blossom / seasonal info)
├── .time-countdown-wrap #time-countdown (countdown timer — ticks every second)
├── .today-card #today-card (today's itinerary summary — JS rendered)
│   └── .today-card-inner (background:var(--surface), border, border-radius:var(--r))
│       ├── .today-card-header (Material icon + title: "Today's Plan · Day X · CityName")
│       ├── .today-weather (weather icon + temp + desc + sunrise/sunset — all Material icons)
│       └── .today-events-timeline (list of events with colored dots + time + name)
│           └── .today-ev (.past=opacity:.4, .current=font-weight:600)
└── .weather-forecast-strip #weather-strip (14-day horizontal scroll weather cards)
    └── .weather-strip-scroll (overflow-x:auto)
        └── .weather-day × 14 (Material weather icon + temp + desc + sunrise/sunset + golden hour + city label)
            .weather-day.today gets border-color:var(--text) highlight
```

**Weather strip city label** — each card must show the city the traveler is in that day as a visible text label (not just a tooltip dot). Use `.wd-city-row` wrapper containing `.wd-city-dot` + `.wd-city-label.wd-city-{city}`:

```js
// In renderWeatherStrip(), build the row with the city color injected as a CSS variable
// (no per-city CSS classes — driven by trip.cities[] data):
const c = TRIP.cities.find(x => x.id === w.city) || {};
'<div class="wd-city-row" style="--city-color:' + (c.color || 'var(--text-3)') + '" data-city="' + w.city + '">' +
  '<div class="wd-city-dot" title="' + getCityName(w.city) + '"></div>' +
  '<span class="wd-city-label">' + getCityName(w.city) + '</span>' +
'</div>'
```

```css
/* City colors come from trip.json `cities[].color` and are injected via the
   --city-color CSS variable on the row element. NEVER add per-city classes here. */
.wd-city-dot{width:6px;height:6px;border-radius:50%;background:var(--city-color, var(--text-3));flex-shrink:0}
.wd-city-row{display:flex;align-items:center;justify-content:center;gap:4px;margin-top:6px}
.wd-city-label{font-size:.58rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:52px;color:var(--city-color, var(--text-2))}
```

City labels must reflect **the city the traveler is actually in on that date** — read from `WEATHER_DATA[].city` which is populated from the trip schedule in Phase 4. The label is localized via `getCityName(w.city)` → `t('city_' + city)`.

**IMPORTANT: All icons must be Material Symbols Outlined (`<span class="mi material-symbols-outlined">`).
NO emoji anywhere in the UI.** Weather icons use: `clear_day`, `partly_cloudy_day`, `rainy`, `grain`, `cloudy`.
City icons use: `park`, `landscape`, `temple_buddhist`, `beach_access`, `ramen_dining`, `directions_boat`.
Sunrise: `wb_twilight`. Sunset: `nightlight`. Golden hour: `photo_camera`.

**Today card style must match chart-panel:** white background (`var(--surface)`), `border:1px solid var(--border)`, `border-radius:var(--r)`. NO gradient backgrounds, NO colored themes per city.

**Tab 2: Spots / Map (id=tab-time)** — full-height map + POI list, no header
```
├── .filters (row of .chip buttons, margin-top:0 — flush to top)
└── .attr-layout (2-col grid: map left, POI list right, height:calc(100vh - 120px))
    ├── #map (Leaflet/OpenStreetMap, flex:1, min-height:0)
    │   Use: L.map() + L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png')
    │   Colored L.circleMarker per category, L.layerGroup for easy filter clearing
    │   "Export to Google Maps" button overlay
    └── .poi-list (scrollable, max-height:100%, min-height:0)
        └── .poi (row: dot + info + Google Maps link + checkbox)
```

**Tab 2: Calendar / Schedule**
```
├── .hdr
└── .calendar-desktop (border frame)
    ├── .cal-header (8-col grid: time corner + 7 day headers)
    │   └── .cal-day-hdr (day name mono uppercase + large serif number)
    │       current day: inverted black bg
    └── .cal-grid (8-col grid: time labels + 7 day columns, scrollable)
        ├── time column (.cal-time-slot: 60px height per hour, mono font)
        └── day columns (.cal-day-col: relative positioned)
            ├── hour grid lines (1px border-bottom per hour)
            └── .cal-event (absolute positioned, black fill or outline variant)
                ├── .ev-title (serif font, bold)
                └── .ev-loc (mono font, time)

Mobile fallback (.calendar-mobile, shown <768px):
└── .cal-m-day (flex: date left + events right)
    ├── .cal-m-date (day name + large number)
    └── .cal-m-events
        └── .cal-m-event (3px black bar left + title + time)
```

**Weather Strip — City-Labeled Cards (mandatory)**

Each day in `trip.weather[]` has a `city` field that references a city `id` in `trip.cities[]`. The matching city entry carries its display name and color.
This city determines **both** the dot color **and** a visible city label below each weather card.
The label must be **always visible** (not just a tooltip), using this exact markup:

```js
'<div class="wd-city-row">' +
  '<div class="wd-city-dot" title="' + getCityName(w.city) + '"></div>' +
  '<span class="wd-city-label wd-city-' + w.city + '">' + getCityName(w.city) + '</span>' +
'</div>'
```

CSS for the city strip — generic, no per-city rules:
```css
.wd-city-dot   { width:6px; height:6px; border-radius:50%; background:var(--city-color, var(--text-3)); flex-shrink:0 }
.wd-city-row   { display:flex; align-items:center; justify-content:center; gap:4px; margin-top:6px }
.wd-city-label { font-size:.58rem; font-weight:600; letter-spacing:.2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:52px; color:var(--city-color, var(--text-2)) }
```

The city color is injected at runtime by setting `--city-color` on the row element from `trip.cities[].color`. **Do not add per-city CSS rules** — that would violate the [template contract](template-contract.md).

**Rule:** City labels must reflect the city the traveler is **actually in** on that date — read from `WEATHER_DATA[].city`, not assumed from the itinerary header.

**Tab 2.5: Booking (id=tab-booking)** — confirmed bookings + ticket comparison + recommended to buy

This tab is **fully data-driven** from `TRIP.booking` — no hardcoded HTML. All content is rendered by `renderBooking()` called at init.

```
├── .hdr (title: "票券比價" / localized, subtitle: "已購 / 未購 / 建議購買")
├── .booking-section
│   ├── .booking-section-title (checklist icon + "已預訂項目")
│   └── .booked-grid #booking-confirmed  ← renderBooking() sets innerHTML
│       Renders TRIP.booking.confirmed[] as .booked-card items:
│       - type="flight": .booked-card-wide.flight-card with .flight-segments → .flight-seg[]
│         Each seg: .flight-seg-badge + .flight-seg-body (.flight-seg-route + .flight-seg-detail)
│         Flight footer: .booked-card-cost + #flight-verdict-inline (populated by renderFlightIntel())
│         Flight checkin: .flight-checkin-note with link
│       - type="ferry": .booked-card with meta rows + .booked-card-links (departure + arrival map links)
│       - type="hotel": .booked-card with dates + price + optional map link
│       - type="activity": .booked-card with desc + meetup + map link
│       Badge classes: .booked-badge.done (confirmed) / .booked-badge.pending (pending)
├── .booking-section
│   ├── .booking-section-title (sell icon + "票券比價（未購）")
│   └── #booking-comparison  ← renderBooking() sets innerHTML
│       Renders TRIP.booking.comparison[] as .booking-table-wrap > .booking-table
│       Columns: 項目 | 官網 | Klook | KKday | 建議
│       Best-price cell gets: <span class="best-price">{price} <span class="star-mark">★</span></span>
└── .booking-section
    ├── .booking-section-title ("⏳ 建議購買")
    └── .recommend-grid #booking-tobuy  ← renderBooking() sets innerHTML
        Renders TRIP.booking.to_buy[] as .recommend-item (name + .rec-note)
```

**`renderBooking()` function contract:**
```js
function renderBooking() {
  const bk = TRIP.booking;
  if (!bk) return;
  // 1. Set #booking-confirmed innerHTML from bk.confirmed[]
  // 2. Call renderFlightIntel() to populate #flight-verdict-inline
  // 3. Set #booking-comparison innerHTML from bk.comparison[]
  // 4. Set #booking-tobuy innerHTML from bk.to_buy[]
}
```
Called at init: `safe('renderBooking', renderBooking);`

**`TRIP.booking` data schema:**
```json
"booking": {
  "confirmed": [
    {
      "id": "bk1",
      "type": "flight | ferry | hotel | activity",
      "title": "Display name",
      "status": "confirmed | pending",
      // flight-specific:
      "carrier": "Airline name", "carrier_code": "IT",
      "segments": [
        {
          "label_i18n": "booking_outbound | booking_return",
          "flight": "IT606",
          "date": "YYYY-MM-DD",
          "departure": {"airport": "TPE", "terminal": "T1", "city": {"zh": "桃園"}, "time": "16:40"},
          "arrival":   {"airport": "PUS", "terminal": "T1", "city": {"zh": "金海"}, "time": "19:55"},
          "duration": "2h15m",
          "maps_dep": "https://www.google.com/maps/...",
          "maps_arr": "https://www.google.com/maps/..."
        }
      ],
      "checkin_url": "https://...",
      "checkin_note_i18n": "booking_checkin_note",
      // ferry-specific:
      "date": "YYYY-MM-DD",
      "departure": {"city": "釜山", "terminal": "碼頭名", "time": "20:00", "maps": "https://..."},
      "arrival":   {"city": "福岡", "terminal": "碼頭名", "time": "07:30+1", "maps": "https://..."},
      // hotel-specific:
      "dates": "3/30–4/3", "price_per_night": "NT$706/晚", "maps_url": "https://...",
      // activity-specific:
      "date": "YYYY-MM-DD", "desc": "Description", "meetup": "Meeting point", "maps_url": "https://...",
      // all types:
      "price": "NT$19,600", "price_twd": 19600
    }
  ],
  "comparison": [
    {
      "id": "cmp1",
      "name": "景點名", "name_note": "副標題",
      "prices": {"official": "₩12,000", "klook": "₩12,000", "kkday": "₩7,200"},
      "best": "official | klook | kkday | null",
      "verdict_i18n": "booking_kkday_save"
    }
  ],
  "to_buy": [
    {"id": "tb1", "name_i18n": "booking_rec_esim", "note_i18n": "booking_rec_esim_note"}
  ]
}
```

**New i18n key needed:** `booking_checkin_note` — the web check-in reminder text.

**Tab 3: Expenses**

The Expenses tab has two modes switchable via a toggle: **Estimated** (pre-trip budget) and **Actual** (real spending during the trip). Both modes share the same layout structure.

```
├── .hdr (title: "Expenses" / localized equivalent)
├── .budget-mode-switcher (pill toggle: [Estimated] [Actual])
├── .budget-top (single column — total panel only, no city bar chart)
│   └── .budget-total-panel (inverted black, large amount + currency switcher)
│       Label changes: "Estimated Total" vs "Actual Total" based on mode
├── .chart-panel "City Cost Ratio" (horizontal bar chart)
│   └── .h-bars → .h-bar-row per city
│       Estimated mode: from budget items' city field
│       Actual mode: from purchased items + daily expense items (both have city field)
├── .chart-panel "Cost by Category" (horizontal bar chart)
│   └── .h-bars → .h-bar-row per category (colored per cat)
│       Categories: hotel, food, transport, attraction, shopping, other
│       NOTE: Use horizontal bars only, NOT cat-card icon boxes.
├── #items-list-wrap (detail list — format differs by mode)
│   Estimated mode:
│   └── .items-table-wrap (flat list with item + city + cost columns)
│   Actual mode:
│   ├── .items-table-wrap "Pre-purchased" (budget items with purchased:true)
│   │   └── .item-row per purchased item (icon + name + cost)
│   └── .items-table-wrap per date (daily expense groups)
│       ├── header: date + day total
│       └── .item-row per expense (icon + name + cost)
```

**Data structure for actual expenses** (`trip.json`):
```json
"budget": {
  "items": [
    {"name":"...", "city":"busan", "cat":"transport", "cost_twd":19600, "purchased":true},
    {"name":"...", "city":"busan", "cat":"hotel", "cost_twd":2822}
  ],
  "actual_expenses": [
    {"date":"2026-03-30", "items":[
      {"name":"Dinner", "cat":"food", "cost_twd":348, "city":"busan"}
    ]},
    {"date":"2026-03-31", "items":[
      {"name":"Fukuoka hotel", "cat":"hotel", "cost_twd":11120, "city":"fukuoka"},
      {"name":"ARTE ticket", "cat":"attraction", "cost_twd":423, "city":"busan"}
    ]}
  ]
}
```

Key rules:
- Budget items with `"purchased":true` appear in the "Pre-purchased" group in actual mode
- Each actual expense item should have a `city` field for accurate city ratio calculation
- The mode toggle uses pill-style buttons (`.budget-mode-btn`) similar to currency switcher
- No checkboxes on budget items — items are displayed as plain rows
- The nav label for this tab is "Expenses" (not "Budget")

**Tab 4: Charts**
```
├── .hdr
└── .charts-grid (2-col grid, border frame)
    ├── .chart-panel.full (time allocation — CSS bar chart, spans both cols)
    ├── .chart-panel (spending trends — bar chart + view switcher)
    └── .chart-panel (category breakdown — horizontal bar rows)
```

**Tab 5: Checklist**
```
├── .hdr
├── .check-grid (auto-fill grid, border frame)
│   └── .check-group (title with 2px bottom border + checkbox items)
│       checked items: muted color + strikethrough
└── .nomad (border frame, if nomad mode)
    ├── .nomad-head (title)
    └── .nomad-spot (marker + name + addr + tags)
        NO hover effect (keep clean for mobile)
```

**Tab 6: Retro (Post-Trip Retrospective)**
```
├── .hdr (title: "Trip Retro" / localized)
├── .retro-map-section (one Leaflet/OpenStreetMap per city with route overlay)
│   ├── .retro-city-selector (pill buttons: one per city, e.g. "Busan (3/30-4/3)")
│   └── .retro-map-container (Leaflet map with POI markers + dashed route lines)
│       └── Leaflet map — category-colored circle markers, dashed polylines connecting POIs by day
├── .retro-budget-section (budget review)
│   ├── .retro-budget-header ("Budget Review" + overall verdict badge)
│   ├── .retro-budget-comparison (estimated vs actual side-by-side bars)
│   ├── .retro-budget-highlights (what went well — green cards)
│   └── .retro-budget-overruns (where you overspent — amber cards with reasons)
├── .retro-missed-section (missed attractions + next-trip suggestions)
│   ├── .retro-missed-header ("For Next Time")
│   ├── .retro-missed-list (POIs that were planned but not visited)
│   │   └── .retro-missed-item (name + reason skipped + "save for next trip" action)
│   └── .retro-next-trip (AI-generated next-trip suggestions based on what was missed)
└── .retro-changelog-section (plan vs reality)
    ├── .retro-changelog-header ("What Changed")
    ├── .retro-changelog-timeline (vertical timeline of modifications)
    │   └── .retro-change-item (date + what changed + why + impact)
    └── .retro-lessons (AI-generated planning lessons for next trip)
```

**Retro tab visibility:** This tab is HIDDEN during pre-trip and during-trip phases. It only
appears in the sidebar/bottom-bar navigation AFTER the trip end date has passed (check against
`TRIP.endDate`). On the trip's last day, show a prompt: "Trip is ending! Start your retro?"

**NOTE:** The app has exactly 7 tabs:
Overview (tab-attractions), Calendar (tab-calendar), Booking (tab-booking),
Budget (tab-budget), Spots/Map (tab-time), Checklist (tab-checklist), Retro (tab-retro).

#### Visual Design System

##### Design Philosophy

**Clean Productivity Tool.** This is a calendar-app / Notion-like UI — NOT a travel blog with
hero images, gradients, or playful illustrations. The aesthetic is functional, information-dense,
and respects the user's time. Visual hierarchy is created through weight contrast (bold vs light),
spacing, and selective use of inverted black sections — not through color or decoration.

**What this design IS:** Notion, Linear, Google Calendar, Things 3
**What this design is NOT:** travel blog hero, gradient cards, rounded bubbly UI, colorful dashboards

##### Color Tokens (CSS custom properties)

```css
:root {
  --bg: #f5f5f5;          /* page background — light warm gray */
  --surface: #ffffff;      /* card/panel background */
  --text: #000000;         /* primary text — true black */
  --text-2: #666666;       /* secondary text */
  --text-3: #999999;       /* tertiary/muted text */
  --accent: #000000;       /* accent = black (no color accent) */
  --accent-bg: rgba(0,0,0,0.04);  /* subtle hover/active bg */
  --border: #e8e8e8;       /* light dividers */
  --shadow: 0 1px 2px rgba(0,0,0,0.03);  /* minimal shadow */
  --shadow-lg: 0 2px 8px rgba(0,0,0,0.08);
  --r: 24px;               /* large border radius */
  --r-sm: 12px;            /* small border radius */
  --font: 'Noto Sans TC', 'Noto Sans JP', 'Noto Sans KR',
          -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --ease: 0.2s ease;
  --sidebar-w: 60px;

  /* Category colors — vibrant, distinct, used for map markers + schedule blocks */
  --cat-attraction: #e8664a;   /* warm coral */
  --cat-hotel: #4a7ce8;        /* blue */
  --cat-food: #4aad5b;         /* green */
  --cat-cafe: #9b6ad4;         /* purple */
  --cat-shopping: #e8964a;     /* orange */
  --cat-transport: #4ab8c9;    /* teal */
  --cat-work: #6a6ad4;         /* indigo */
  --cat-other: #888;           /* gray */
  --cat-personal: #c9b99a;     /* warm beige — wake-up times, meals, personal routines */

  /* Chart fill */
  --chart-bar: #D4D4D8;
  --chart-bar-hover: #A8A8B0;
}
```

**Schedule block colors** use soft pastel backgrounds with darker text:
```
attraction: bg #fde8e3, text #a33
food:       bg #e3f5e6, text #2a7a36
cafe:       bg #ede3f5, text #6a3a9b
work:       bg #e3e3f5, text #4a4a9b
transport:  bg #e0f2f5, text #2a7a8a
hotel:      bg #e3ecf8, text #2a5a9b
personal:   bg #f5ede0, text #8a6a3a  ← wake-up / breakfast / personal events (border #e8d5b8)
```

**Hard rules:** No dark mode toggle. No FAB (floating action button). No gradients. No colored
accent — black IS the accent.

##### Typography

```css
/* Noto Sans for CJK + system fallbacks — Google Fonts CDN required */
body { font-family: var(--font); line-height: 1.55; }

/* Scale */
h1           { font-size: 2rem; font-weight: 700; letter-spacing: -0.5px; }
.hdr-meta    { font-size: 0.9rem; color: var(--text-2); }          /* date range, duration */
.hdr-desc    { font-size: 0.9rem; color: var(--text-2); }          /* subtitle / description */
.st-label    { font-size: 0.75rem; text-transform: uppercase;       /* stat labels */
               letter-spacing: 0.5px; color: var(--text-3); }
.st-val      { font-size: 1.5rem; font-weight: 700; }              /* stat numbers */
body text    { font-size: 0.85–0.9rem; }                           /* general content */
.small       { font-size: 0.72–0.78rem; }                          /* meta, timestamps */
```

##### CSS Reference for Key Components

These are the **exact CSS patterns** to use. Copy them into the generated `<style>` block.

```css
/* === SIDEBAR (desktop) === */
.sidebar {
  width: var(--sidebar-w); background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column; align-items: center;
  padding: 16px 0; gap: 4px;
  position: fixed; top: 0; left: 0; bottom: 0; z-index: 100;
}
.sb {
  width: 40px; height: 40px; border: none; background: transparent;
  border-radius: var(--r-sm); cursor: pointer; color: var(--text-3);
  display: flex; align-items: center; justify-content: center;
  transition: all var(--ease);
}
.sb:hover { background: var(--bg); color: var(--text); }
.sb.active { background: var(--accent-bg); color: var(--accent); }

/* === BOTTOM BAR (mobile) === */
/*
 * Tab Bar Design Rules (Mobile Bottom Navigation):
 * - Maximum 5 items (3-5 optimal). If more tabs exist, use a "More" button as the 5th item.
 * - Each tab has equal flex width (flex:1) — never cluster in center.
 * - Fixed at bottom, never scrolls with content.
 * - Safe area: padding-bottom uses env(safe-area-inset-bottom) for notch/home-indicator devices (~16px, not 34px).
 * - viewport meta must include viewport-fit=cover for safe area to work.
 * - Main content needs padding-bottom: calc(88px + env(safe-area-inset-bottom, 0px)) to avoid overlap.
 * - Tap-to-top: tapping the active tab scrolls back to top.
 * - More menu: absolute-positioned popup above the tab bar, closes on any outside click.
 * - All floating menus (More menu, lang menu) must close on document click (single handler).
 * - Touch target: minimum 44×44pt per tab item.
 *
 * | Spec                  | Value                                           |
 * |-----------------------|-------------------------------------------------|
 * | Tab Count             | 3-5 items max (use "More" for overflow)         |
 * | Icon Size             | 24×24px (Material Symbols at font-size:24px)    |
 * | Icon Style            | Consistent (all outlined, active = filled)      |
 * | Label Font Size       | 0.7rem (~11px / 10-11pt), Medium or Semibold    |
 * | Icon-Label Gap        | 3px (avoid visual separation)                   |
 * | Labels                | Short text below icon, i18n via data-i18n       |
 * | Active State          | Brand accent color + font-weight:600 + FILL:1   |
 * | Bottom Padding        | 4px base + env(safe-area-inset-bottom, ~16px) on iOS |
 * | Bar Height            | ~49pt content + safe area padding               |
 */
.bottom-bar {
  display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
  background: var(--surface); backdrop-filter: blur(16px);
  border-top: 1px solid var(--border);
  padding: 4px 0 calc(env(safe-area-inset-bottom, 0px) + 4px);
  /* 4px base + env() adds ~16px on iOS notch devices for home indicator */
}
.bottom-bar-inner { display: flex; justify-content: space-around; max-width: 440px; margin: 0 auto; }
.bb {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 6px 8px; background: none; border: none; cursor: pointer;
  color: var(--text-3); font-size: 0.7rem; flex: 1;
}
.bb .mi, .bb .material-symbols-outlined { font-size: 24px; opacity: .5; font-variation-settings: 'FILL' 0; }
.bb.active .mi, .bb.active .material-symbols-outlined { opacity: 1; font-variation-settings: 'FILL' 1; }
.bb.active { color: var(--accent); font-weight: 600; }
#bb-more-btn.has-active { color: var(--accent); font-weight: 600; }

/* More menu (overflow tabs) */
.bb-more-menu {
  display: none; position: absolute; bottom: 100%; right: 8px;
  background: var(--surface); backdrop-filter: blur(16px);
  border-radius: 12px; box-shadow: 0 -4px 24px rgba(0,0,0,.12);
  padding: 6px; min-width: 140px; margin-bottom: 4px;
}
.bb-more-menu.open { display: flex; flex-direction: column; gap: 2px; }
.bb-more-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; background: none; border: none; cursor: pointer;
  color: var(--text-2); font-size: 0.8rem; border-radius: 8px;
}
.bb-more-item:active { background: rgba(0,0,0,.05); }
.bb-more-item.active { color: var(--accent); font-weight: 600; }

/* === MAIN CONTENT === */
.main {
  margin-left: var(--sidebar-w); flex: 1;
  padding: 32px 40px; max-width: 1300px;
}

/* === PAGE HEADER === */
.hdr {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 8px; flex-wrap: wrap; gap: 12px;
}

/* === STATS BAR (inverted) === */
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px; margin: 20px 0 28px;
}
.st {
  background: var(--surface); border-radius: var(--r);
  padding: 16px 20px; box-shadow: var(--shadow);
}

/* === FILTER CHIPS === */
.chip {
  padding: 4px 12px; border-radius: 99px;
  border: 1px solid var(--border); background: transparent;
  font-size: 0.78rem; cursor: pointer; color: var(--text-2);
}
.chip.on {
  background: var(--text); color: var(--surface);
  border-color: var(--text);
}

/* === ATTRACTIONS LAYOUT === */
.attr-layout {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
}
#map {
  width: 100%; height: 480px; border-radius: var(--r);
  border: 1px solid var(--border); z-index: 1;
}
#map iframe {
  width: 100%; height: 100%; border: 0; border-radius: var(--r);
}
.poi-list {
  display: flex; flex-direction: column; gap: 8px;
  max-height: 480px; overflow-y: auto;
}
.poi {
  background: var(--surface); border-radius: var(--r-sm);
  padding: 12px 14px; display: flex; gap: 10px; align-items: flex-start;
  cursor: pointer; border: 1px solid transparent;
  transition: all var(--ease);
}
.poi:hover { border-color: var(--border); box-shadow: var(--shadow); }

/* === CALENDAR WEEK VIEW === */
/* Desktop: 8-col grid (time + 7 days), 60px per hour row */
.cal-header {
  display: grid; grid-template-columns: 60px repeat(7, 1fr);
  border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 10; background: var(--surface);
}
.cal-grid {
  display: grid; grid-template-columns: 60px repeat(7, 1fr);
}
.cal-event {
  position: absolute; left: 4px; right: 4px;
  background: #d0d0d0; border-radius: 6px; padding: 6px 8px;
  font-size: 0.75rem; font-weight: 500; overflow: hidden;
  cursor: grab; z-index: 2; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* === BUDGET LAYOUT === */
/* Top: 2-col grid (chart left, total right) */
/* Category cards: auto-fit grid, minmax(280px, 1fr) */
/* Items: vertical list with checkbox rows */

/* === BUTTONS === */
.btn-primary {
  background: var(--text); color: var(--surface);
  padding: 8px 16px; border: none; border-radius: var(--r-sm);
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
}
.btn-ghost {
  background: transparent; color: var(--text-2);
  border: 1px solid var(--border); border-radius: var(--r-sm);
  padding: 8px 16px; font-size: 0.85rem; cursor: pointer;
}
.btn-icon {
  width: 36px; height: 36px; padding: 0; justify-content: center;
}

/* === VIEW SWITCHER PILLS === */
/* Container: flex, gap 8px, bg var(--bg), padding 4px, border-radius 8px */
/* Active pill: bg var(--text), color var(--surface), border-radius 6px */
/* Inactive pill: bg transparent, color var(--text-2) */

/* === CHARTS (pure CSS bar charts) === */
/* Vertical bars: flex row, align-items flex-end, height ~180px */
/* Each bar: flex:1, background var(--chart-bar), border-radius 12px 12px 0 0 */
/* Below bar: label (font-weight 600) + sublabel (font-size 0.7rem, text-3) */
/* Horizontal bars: width 100%, height 6-8px, bg #f0f0f0, inner fill bg var(--chart-bar) */
```

##### Icons (MANDATORY: Material Symbols M3 only)

- **ABSOLUTELY NO emoji for UI elements** — use **Google Material Symbols Outlined (M3)** from Google Fonts CDN
- This applies to ALL icons: navigation, todo items, category badges, action buttons, entry forms, status indicators
- Add to `<head>`: `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap">`
- Usage: `<span class="mi material-symbols-outlined">map</span>` where "map" is the Material Symbol name
- CSS class `.mi`: `font-family:'Material Symbols Outlined'; font-size:20px; display:inline-block; line-height:1; vertical-align:middle; color:currentColor`
- Sidebar/bottom bar icons use `.mi` at 20px, POI links use 14px, todo items use 20px
- Browse icon names at: https://fonts.google.com/icons?icon.set=Material+Symbols
- Common icons: `map`, `calendar_month`, `sell`, `wallet`, `schedule`, `checklist`, `print`, `location_on`, `flight`, `flight_takeoff`, `hotel`, `restaurant`, `shopping_bag`, `work`, `local_cafe`, `train`, `directions_boat`, `translate`, `open_in_new`, `travel_explore`, `luggage`, `badge`, `sim_card`, `currency_exchange`, `power`, `confirmation_number`, `cloud`, `content_copy`, `warning`
- **Exception**: Country flag emoji are OK for country indicators only

##### i18n Completeness (MANDATORY)

**Single-language is the default.** A trip emits one language — the user's conversation language. Multi-lang is opt-in only. The rules below describe **shape requirements** that apply in both modes; the only difference is how many keys live inside each i18n object.

**One format only — nested i18n objects. Bare strings and flat-sibling keys (`name_en`, `desc_ko`) are FORBIDDEN.** The validator (`scripts/validate-trip.mjs`) blocks both.

**Every user-visible text field is a nested i18n object:**

```json
// Single-lang (default):
{ "name": { "zh": "釜山" }, "desc": { "zh": "海濱城市" } }

// Multi-lang (opt-in only):
{ "name": { "zh": "釜山", "en": "Busan" }, "desc": { "zh": "海濱城市", "en": "Coastal city" } }
```

**What must be a nested i18n object** (this list is non-exhaustive — any visible string field follows the same shape):

- **Static HTML chrome** — use `data-i18n="key"` and read from `trip.i18n.{lang}.{key}`.
- **JS-rendered chrome** — use `t('key')`. **NEVER** hardcode `isZh ? '中文' : 'English'` ladders.
- **POI fields**: `name`, `nameLocal`, `desc`, `addr`. Plus optional `dining.party_label`, `dining.seating`, `dining.tips_solo[]`, `dining.tips_group[]` (each tip is itself an i18n object).
- **Schedule**: `events[].name`, `events[].note`, `events[].restaurant`.
- **Budget**: `items[].name`, `actual_expenses[].name`.
- **Checklist**: `groups[].title`, `groups[].items[].label`.
- **Entry forms**: `entryForms[].title`, `fields[].label`. Plus `entryRequirements[].name`, `entryRequirements[].items[].task`.
- **Booking**: `purchased[].name`, `compare[].name`, `recommended[].name`, `passes[].name`, flight `depart.place` / `arrive.place`.
- **Retro** (post-trip): `changelog[].description`, `changelog[].reason`, `changelog[].lesson`, `missed_pois[].reason`, `missed_pois[].suggestion`, `planning_lessons[]`, `budget_review[].note`.
- **Holidays**: `holidays.items[].name`.

**POI primary/secondary name logic:** `name` (translated to current lang) shows as primary, `nameLocal` (the on-the-ground local-script name, also an i18n object) shows as secondary. Same rule in both single-lang and multi-lang. The renderer never needs per-language conditionals — it just calls `L(poi.name)` and `L(poi.nameLocal)`.

**`applyLang()` must re-render ALL dynamic content** (only meaningful in multi-lang mode, but harmless in single-lang):
`renderPOIs()`, `renderCalendar()`, `renderBudget()`, `renderChecklist()`, `renderEntryForms()`, `renderNomadSpots()`, `renderToday()`, `updateClocks()`, `renderOverviewExtras()`, `renderRetro()`.

**Verification before shipping:**
1. Run `node scripts/validate-trip.mjs <folder>` — must exit 0. It checks every field shape and i18n key coverage automatically.
2. Single-lang: switch through every tab, confirm no `[object Object]` (means a bare object leaked into the DOM without going through `L()`).
3. Multi-lang only: switch each lang in `supportedLangs`, confirm no foreign-language text leaks across modes.

##### Responsive Breakpoints

```css
@media (max-width: 640px) {
  .sidebar { display: none !important; }
  .bottom-bar { display: block !important; }
  .main { margin-left: 0; padding: 16px 12px calc(88px + env(safe-area-inset-bottom, 0px)); }
  .hdr-left h1 { font-size: 1.4rem; }
  .stats { grid-template-columns: 1fr 1fr; gap: 10px; }
  .attr-layout { grid-template-columns: 1fr; }
  #map { height: 260px; }
  .calendar-desktop { display: none !important; }
  .calendar-mobile { display: block; }
  /* budget-top, charts-grid, check-grid → single column */
}

@media print {
  .sidebar, .bottom-bar { display: none !important; }
  .main { margin-left: 0; padding: 20px; }
  .tab-panel { display: block !important; } /* show all tabs */
}
```

##### Non-Negotiable Design Rules

1. **ABSOLUTELY NO hero banner / hero image** — no `.hero-banner`, no `<img>` at the top, no splash
   image from Pinterest/Unsplash/anywhere. The page starts DIRECTLY with a compact h1 + meta + desc.
2. **Stats bar is inverted** — black background, white text, immediately after the header
3. **Cards have border-radius 24px** — this defines the visual identity
4. **Chips are pills** (border-radius 99px), not rectangles
5. **Category colors are vibrant** — the only color in the UI comes from category indicators
6. **Hover states are subtle** — border appears or shadow deepens, never color change
7. **View switchers use pill groups** — not tabs, not dropdowns
8. **Budget items are list rows** — never a full HTML `<table>`
9. **Calendar uses 60px per hour** — consistent visual density
10. **All monetary values get `data-cost` attribute** — for JS manipulation
11. **Map uses Leaflet + CartoDB Voyager basemap** — `L.map()` + `L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {subdomains:'abcd', maxZoom:20, attribution:'© OpenStreetMap contributors © CARTO'})` with colored `L.circleMarker` per category. **Do NOT use `tile.openstreetmap.org` directly** — OSM blocks high-volume browser traffic with 403. CartoDB allows anonymous public use and has stable CORS. Include an "Export to Google Maps" button overlay that generates a Google Maps directions URL with the currently visible POIs and opens in a new tab. Every POI also has an individual Google Maps link. Include Leaflet CSS/JS from unpkg CDN.
12. **No floating elements** — no FAB, no floating chat, no sticky banners
13. **Chart bars must have visible color** — `--chart-bar` should be `#888` or darker, NOT light gray like `#D4D4D8`. Time allocation bars should use category colors (attraction=coral, work=indigo, food=green, etc.)
14. **Mobile padding is mandatory** — all content sections (charts, h-bars, cat-grid, items-table, section-labels) must have `padding: 0 16px` on mobile. Header and calendar also need top padding.
15. **Category breakdown uses horizontal bars** — use `.h-bars` + `.h-bar-row` style (like city breakdown), NOT `.cat-card` icon boxes. This saves vertical space.
16. **Expenses tab has no checkboxes** — budget items are plain rows (name + city + cost). The tab has an Estimated/Actual toggle. In actual mode, items with `purchased:true` appear in a "Pre-purchased" group, followed by daily expense groups. Each actual expense item has a `city` field for city ratio calculation.
17. **Cover page is MANDATORY** — always included. Default to a dark gradient background (`#1a1a2e`). The user can upload their own photo via a top-right camera button (persist in `localStorage`). If the AI cannot generate a cover image, fall back to a solid/gradient background and let the user upload manually. The cover page is the first screen of the app (after the Today overlay). Tap GO or swipe up to enter the main UI.
18. **Live clocks on Calendar tab** — show real-time clocks in the calendar header: destination local time (primary, inverted black) + passport country time (secondary). Update every 30 seconds. Use `toLocaleTimeString` with `timeZone` option.
19. **Now line on Calendar** — a red horizontal line (`#e8664a`) with a dot and time label showing the current **destination timezone** (e.g., "02:43 GMT+9" or "02:43 KST"). Use `toLocaleString('en-US', {timeZone: DEST_TZ, timeZoneName:'short'})` to get the timezone abbreviation. Updates every 30 seconds.
20. **Time allocation is computed from schedule** — do NOT hardcode time data. Calculate total hours per category and city days from the actual `schedule` array in trip.json. Render dynamically via JS.
21. **Language switcher in sidebar** — add a language toggle button at the bottom of the sidebar (above print). **Hide the entire button (`hidden` attribute or `display:none`) when `TRIP.supportedLangs.length <= 1`** — there is nothing to switch to in single-lang mode (the default). When multi-lang is enabled, it cycles between: the user's passport language (e.g., Traditional Chinese for Taiwan passport) and the destination's local language(s) (e.g., Korean for Korea, Japanese for Japan). The switcher updates which i18n key is displayed via `t()`/`L()`. POI names already have `nameLocal` — use that. UI labels, section titles, and tab names live in `trip.i18n`.
22. **Booked flight cards** — outbound and return flights are shown in ONE card with a vertical divider. Each flight shows: flight number, date+time, airline, departure→arrival terminal numbers, Google Maps links for each terminal, AND a **Web Check-in link** with the airline's online check-in URL + when it opens (e.g., "Opens 48hr - 1hr before departure"). Research the specific airline's check-in window.

    **CRITICAL: Timezone-aware flight duration calculation.** Flight duration MUST account for timezone differences between departure and arrival airports. Do NOT simply subtract local arrival time from local departure time — this produces wrong results for international flights.

    **Correct method:**
    1. Convert both departure and arrival times to UTC first
    2. Subtract to get actual flight duration
    3. Example: TPE 16:40 (UTC+8) → PUS 19:55 (UTC+9)
       - Depart: 16:40 - 8h = 08:40 UTC
       - Arrive: 19:55 - 9h = 10:55 UTC
       - Duration: 10:55 - 08:40 = **2h15m** (NOT 3h15m from naive subtraction)
    4. Example: FUK 10:25 (UTC+9) → TPE 11:55 (UTC+8)
       - Depart: 10:25 - 9h = 01:25 UTC
       - Arrive: 11:55 - 8h = 03:55 UTC
       - Duration: 03:55 - 01:25 = **2h30m** (NOT 1h30m from naive subtraction)

    **For schedule events (trip.json):** The `sh`/`eh` values use the day's local timezone (based on the `city` field). For cross-timezone flights, `sh` is departure time in the day's timezone and `eh` is arrival time converted to the day's timezone. The `note` field should show both local times with timezone labels (e.g., "10:25 depart (JP) - 11:55 arrive (TW) - 2h30m flight").

    **For the flight card in index.html:** The displayed duration (e.g., "IT606 - 2h15m") must be the UTC-corrected actual flight time, not the naive local-time difference.
23. **Mobile POI click → scroll to map** — when a POI item is clicked on mobile (`window.innerWidth <= 900`), call `document.getElementById('map').scrollIntoView({behavior:'smooth', block:'start'})` after `focusPOI()` so the user sees the pin on the map.
24. **Pre-trip todo items are context-aware:**
    - `todo_charger` must specify the **exact plug type** needed for the destination country (e.g., "Korea needs round-pin adapter (Type C/F)", "Japan doesn't need an adapter"). Research plug types per destination.
    - `todo_checkin` must be a **clickable link** to the airline's Web Check-in page, with check-in window timing (e.g., "Opens 48hr before departure"). Use `{url:'...'}` in the todo item object, render as `<a>` wrapping the card content.
    - `todo_cash` should mention relevant currencies and approximate amounts.
