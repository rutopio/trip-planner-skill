---
name: components
description: Per-component rendering rules (Cover, Today, Weather, Modal, Clocks, Now Line, Flight Card, Nomad Spots, GeoJSON, Booking links, Meal tracking, Currency)
---

# Component Specifications

This document is the source of truth for **how each interactive UI piece behaves**. SKILL.md references it for component specifics; SKILL.md itself stays high-level.

All data lives in `data/trip.json`. **No component may hardcode trip data into `app.js`.** When this doc shows a JS array (e.g. `WEATHER_DATA`), that's just for the renderer's internal cache — the source is always `TRIP.weather`, `TRIP.pois`, etc.

---

## Layering Order (z-index discipline)

These overlays sit above the main app. Order matters — **Today shows FIRST on initial load, dismisses to reveal Cover, Cover dismisses to reveal Main**.

| Layer | z-index | When visible | Dismiss action |
|-------|---------|--------------|----------------|
| Today overlay (`#today-overlay`) | 201 | First paint, until user clicks "Enter trip planner →" | `.today-overlay.hidden { transform: translateY(-100%); }` |
| Cover page (`#cover`) | 200 | After Today dismissed (or directly if returning user) | `.cover-hidden { transform: translateY(-100vh); }` |
| Main app (`<main>`) | 0 | Always present underneath | — |
| POI modal (`.poi-modal-overlay`) | 300 | When POI clicked | x button / backdrop / Escape |

**Initial-load sequence:**
1. DOMContentLoaded → render everything → Today overlay paints on top.
2. User clicks "Enter" → Today slides up → Cover is now top-most.
3. User clicks GO on Cover → Cover slides up → Main app visible.
4. localStorage `trip-cover-photo` persists the user's uploaded cover image.
5. **Returning visits**: Today overlay still shows first (it's the daily dashboard). Cover may auto-skip if `localStorage['trip-cover-seen']` is set — optional.

---

## Cover Page

Full-screen entry overlay. Slides up to reveal main app.

**Structure:**
```html
<div id="cover" class="cover fixed inset-0 z-[200]">
  <div class="cover-bg" id="cover-bg"></div>
  <div class="cover-overlay">
    <h1 class="cover-title">{trip title via L(TRIP.tagline) or destination}</h1>
    <p class="cover-meta">{dates} · {days} days</p>
    <p class="cover-desc">{tagline}</p>
  </div>
  <div class="cover-bottom">
    <button class="cover-upload" onclick="uploadCover()">
      <span class="material-symbols-outlined">photo_camera</span>
    </button>
    <button class="cover-enter" onclick="enterApp()">
      <span class="material-symbols-outlined">arrow_upward</span>
      <span data-i18n="cover.go">GO</span>
    </button>
  </div>
</div>
```

**Behavior:**
- Photo upload via `<input type="file" accept="image/*">`, base64 to `localStorage['trip-cover-photo']`.
- On load, set `cover-bg` background-image from localStorage if present, else gradient.
- Dismiss: add `.cover-hidden` class (CSS: `transform: translateY(-100vh); transition: 0.6s ease;`).

**Tailwind-first**: most layout uses Tailwind. The slide-up transition needs a `@keyframes` or transition rule in style.css — that's an allowed exception.

---

## Today Dashboard

Full-screen overlay shown FIRST on every visit (above Cover). Context-aware based on current date vs trip dates.

### CRITICAL: Date calculation must use LOCAL time, NOT UTC

```js
// CORRECT — uses local timezone:
const today = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');

// WRONG — toISOString() uses UTC, causes off-by-one in UTC+N timezones:
// const today = now.toISOString().slice(0,10);
```

### Mode switching

```js
// On the departure date, BEFORE persists until first event's start hour.
// Example: flight at 19:30 → BEFORE shown all day until 19:30, then DURING.
var firstEvStart = todaySchedule ? todaySchedule.events[0] : null;
var showBeforeTrip = now < tripStart || (today === TRIP.startDate && firstEvStart && nowHour < firstEvStart.sh);
if (showBeforeTrip) { /* BEFORE */ }
else if (todaySchedule) { /* DURING */ }
else if (now > tripEnd) { /* AFTER */ }
```

### Three modes

**1. BEFORE trip (countdown):**
- Large countdown number ("2") + "days until departure" (shows 0 on departure day until first event).
- Trip destination + tagline + date range.
- Entry requirements pending list (from `TRIP.entryRequirements`) with links.
- Context-aware todo list:
  - `>7 days`: Confirm flights, hotel, tickets, review itinerary
  - `≤7 days`: + Install eSIM, check weather
  - `≤3 days`: + Pack bags, exchange currency
  - `≤1 day`: + Check passport, charger, online check-in
- First event preview (e.g., "Arrive Gimhae Airport — 19:55 landing").
- "Start your trip →" button (glassmorphism: `backdrop-blur-md bg-white/10`).

**2. DURING trip (today):**
- Same centered glassmorphism layout as countdown.
- Date + day-of-week + Day number ("4/1 Wed — Day 3").
- City name in large bold (`today-dest`, translated).
- Event count ("3 events").
- **NOW/NEXT card** (brighter `bg-white/20` for active): current event if in progress, else next, else "Free time" (`coffee` icon).
- Events grouped by time period:
  - Morning (`wb_sunny`): `sh < 12`
  - Afternoon (`wb_twilight`): `sh >= 12 && sh < 18`
  - Evening (`dark_mode`): `sh >= 18`
- Each event card: smart icon (see below) + name + time + note + restaurant Google Maps link.
- **Crowd alert**: if next event has `crowd.crowd_level === "high"` AND now is within `crowd.peak_hours`, show warning above event list.
- Active event (in progress): brighter card bg `bg-white/[0.22]`.

**3. AFTER trip (completed):**
- "Trip Completed" with `flight` icon.
- Trip destination + summary stats.

### Smart icon selection

Flight-related events MUST use `flight` icon. The detector reads ALL i18n values to be language-agnostic:

```js
var getEvIcon = function(ev) {
  var name = Object.values(ev.name || {}).join(' ').toLowerCase();
  if (name.match(/airport|flight|landing|takeoff|airplane|機場|空港|공항/)) return 'flight';
  var CAT_ICONS = {
    attraction: 'attractions', food: 'restaurant', cafe: 'coffee',
    transport: 'directions_transit', work: 'laptop_mac', hotel: 'hotel',
    shopping: 'shopping_bag', personal: 'bedtime'
  };
  return CAT_ICONS[ev.cat] || 'event';
};
```

### Required i18n keys (scoped to Today)

`today_days_left`, `today_enter`, `today_start`, `today_now`, `today_next`, `today_free`, `today_events`, `today_ended`, `today_todo_title`, `today_first`, `today_entry_title`, `today_morning`, `today_afternoon`, `today_evening`, `todo_pack`, `todo_passport`, `todo_esim`, `todo_cash`, `todo_charger`, `todo_checkin`, `todo_tickets`, `todo_hotel`, `todo_weather`, `todo_itinerary`, `todo_flights`.

### Integration

- `renderToday()` is the FIRST call in `bootstrap()` after `injectCityVars`.
- `applyLang()` re-calls `renderToday()` so language changes update Today.
- `dismissToday()` adds `.hidden` for slide-up.

---

## Overview Tab: Weather + Today Card + Weather Strip

`renderOverviewExtras()` calls `renderTodayCard()` and `renderWeatherStrip()`.

### Weather data lives in `TRIP.weather` (NOT in app.js)

```json
// trip.json
"weather": [
  {
    "date": "2026-03-30",
    "icon": "rainy",
    "hi": 14, "lo": 9,
    "desc": { "zh": "陣雨" },
    "sunrise": "06:22",
    "sunset": "18:40",
    "city": "busan"
  }
]
```

- `icon`: Material Symbols icon name (`clear_day`, `partly_cloudy_day`, `rainy`, `grain`, `cloudy`).
- `desc`: nested i18n object (single-lang default).
- `city`: matches a `cities[].id`.

The renderer reads `TRIP.weather` directly. **Never** declare a module-scope `WEATHER_DATA` array — the validator blocks it (`FORBIDDEN_GLOBAL_ARRAYS`).

### Today Card (`renderTodayCard`)

- BEFORE: city icon + "Trip hasn't started yet" + Day 1 preview.
- DURING: city icon + Day X + city name + weather row + events timeline.
- AFTER: `flight_takeoff` icon + "Trip has ended".
- Weather row: Material weather icon + temp + desc + `wb_twilight` sunrise + `nightlight` sunset.
- Timeline: colored dots per category + time + event name. `.past` events dimmed.

### Weather Strip (`renderWeatherStrip`)

- Horizontal scroll, one card per trip day.
- Each card: day number (D1–DN), date, weather icon, temp, desc, sunrise/sunset, golden hour.
- Today's card highlighted with stronger border + box-shadow.
- Auto-scroll to today on render.

### Schedule city name resolution

Schedule events reference cities by id (e.g., `"city": "busan"`). The renderer resolves via `cityById(id).name` which is already an i18n object — no separate `SCHEDULE_CITY_I18N` map needed (validator blocks that too).

---

## POI Detail Modal

When a POI is clicked, open a modal popup.

```html
<div class="poi-modal-overlay fixed inset-0 z-[300] bg-black/40">
  <div class="poi-modal" role="dialog">
    <button class="poi-modal-close">
      <span class="material-symbols-outlined">close</span>
    </button>
    <div id="poi-modal-content"><!-- filled by openPOIModal(id) --></div>
  </div>
</div>
```

**Modal content sections:**
- Header: category dot + `L(poi.name)` + `L(poi.nameLocal)` (if different).
- Info rows: city + address, hours, price (home currency + local), description, category badge.
- **Crowd section** (if `poi.crowd`): visual hourly busyness bar chart, "Best time" green pill, "Avoid" red pill, tips list.
- **Dining section** (if food/cafe + has `dining`): party-size suitability badges, seating info, wait times, party-size tips, mismatch warning if applicable.
- "Search more" links: Google Maps, Google Search, Instagram, YouTube, Xiaohongshu — with favicon icons.

**Behavior:**
- `openPOIModal(id)` → render content + call `focusPOI(id)` to pan map.
- Close: x button, backdrop click, or Escape.
- Mobile: after click, `scrollIntoView` to map.

---

## GeoJSON Export

The Overview tab header includes an "Export GeoJSON" button:

```js
function initExport() {
  document.getElementById('btn-export-geojson').addEventListener('click', () => {
    const geo = {
      type: 'FeatureCollection',
      features: TRIP.pois.map(p => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: {
          name: L(p.name),
          nameLocal: L(p.nameLocal),
          description: L(p.desc),
          category: p.cat,
        }
      }))
    };
    const blob = new Blob([JSON.stringify(geo, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `trip-${TRIP.destination || 'plan'}.geojson`;
    a.click();
  });
}
```

Importable into Google My Maps, QGIS, Mapbox.

---

## Live Clocks (Calendar tab header)

Dual-timezone live clocks, update every 30 seconds.

```html
<div class="clock-wrap">
  <span class="cd-label" data-i18n="clock_dest"></span>
  <span class="cd-digits"><!-- HH : MM --></span>
</div>
<div class="clock-wrap secondary">
  <span class="cd-label" data-i18n="clock_home"></span>
  <span class="cd-digits"></span>
</div>
```

```js
const DEST_TZ = TRIP.timezones?.dest || 'Asia/Tokyo';
const HOME_TZ = TRIP.timezones?.home || 'Asia/Taipei';

function getTimeInTZ(tz) {
  return new Date().toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
}

function initClocks() {
  updateClocks();
  renderNowLine();
  setInterval(() => { updateClocks(); renderNowLine(); }, 30000);
}
```

Timezones come from `TRIP.timezones.{dest,home}` — auto-derived from passport country and destination during Phase 4.

---

## Now Line (Calendar current-time indicator)

Red horizontal line + time label on today's column.

**Desktop:** absolute-positioned line + label inside the today `.cal-day-col`.
**Mobile:** now-indicator inside `.cal-m-events`.

CSS (style.css — exception, can't be Tailwind):
```css
.cal-now-line {
  position: absolute; left: 0; right: 0; height: 2px;
  background: #e8664a; z-index: 5; pointer-events: none;
}
.cal-now-label {
  position: absolute; left: -4px; top: -8px;
  background: #e8664a; color: #fff; font-size: .65rem;
  padding: 1px 6px; border-radius: 4px; font-weight: 600;
  white-space: nowrap;
}
```

- Label shows DEST timezone with abbreviation (e.g., "14:32 JST"). Use `toLocaleString` with `timeZoneName:'short'`.
- Position: `top = (nowHour - HOUR_START) * 60` px (60px/hour scale).
- Update every 30s (shared with Live Clocks).

---

## Nomad Spots (Workspace recommendations)

Only render when the trip has work days (digital nomad mode). Data lives in `TRIP.nomadSpots[]`.

```json
"nomadSpots": [
  {
    "name": { "zh": "Engineer Cafe" },
    "addr": { "zh": "天神 · 赤煉瓦文化館1F" },
    "hours": "09:00–21:00",
    "mapQuery": "エンジニアカフェ+福岡",
    "tags": ["nomad_free", "nomad_wifi", "nomad_power"],
    "coverage": "nomad_coverage"
  }
]
```

Render at the bottom of the Checklist tab. Tags resolved via `t(tag)` (i18n keys).

**Never** declare a module-scope `NOMAD_SPOTS` array in app.js — validator blocks it.

---

## Booking Tab: Flight Card

Full-width card showing outbound + return flight visualizations.

```
.booked-card.flight-card (col-span-full)
├── .booked-card-head: airline name + booked badge
├── .flight-segments
│   ├── .flight-seg (outbound): badge + route viz + detail
│   └── .flight-seg (return): same shape
├── .flight-footer: price + verdict
└── .flight-checkin-note: Web Check-in link + opening window
```

**Required fields per segment:**
- Flight number, date, depart/arrive times.
- Departure/arrival terminals (each with Google Maps link).
- **Timezone-corrected duration** (see below).
- Web check-in URL + check-in window (e.g., "48hr–1hr before departure").
- Inline verdict badge (from `flightIntel`).

### Timezone-aware flight duration

Flight duration MUST use UTC, not local-time subtraction. Cross-timezone flights produce wildly wrong results otherwise.

```js
function flightDurationMinutes(depDate, depTime, depTz, arrDate, arrTime, arrTz) {
  const depUTC = new Date(`${depDate}T${depTime}:00`).toLocaleString('en-US', { timeZone: depTz });
  const arrUTC = new Date(`${arrDate}T${arrTime}:00`).toLocaleString('en-US', { timeZone: arrTz });
  // Compute via UTC-equivalent epoch math.
  // Implementation detail: use Intl.DateTimeFormat with timeZone option to get true offset.
  // ...
}
```

(Full implementation in `app-skeleton.md` C5 group.)

---

## Meal Tracking

Every food event in `schedule[].events[]` must include:

```json
{
  "cat": "food",
  "name": { "zh": "..." },
  "restaurant": { "zh": "자갈치시장 2층 횟집" },
  "map": "https://www.google.com/maps/search/?api=1&query=자갈치시장+부산",
  "reservation": false
}
```

- `restaurant`: nested i18n object (local-language name).
- `map`: Google Maps search URL.
- `reservation`: `false` | `"needed"` | `true`.

**Calendar render:**
- Desktop: restaurant name with map link inside event block.
- Mobile: restaurant name + Map link + reservation status icon.

---

## Booking Links

Every event needing advance booking MUST include `booking_url`:

```json
{
  "reservation": "needed",
  "booking_url": "https://eipro.jp/takachiho1/eventCalendars/index",
  "booking_note": { "zh": "Reservations open at 09:00, 2 weeks in advance" }
}
```

**Applies to:**
1. Timed-entry attractions (boat rides, observation decks, theme parks).
2. Tours / day trips (Klook, KKday, GetYourGuide, Viator).
3. Reservation-only restaurants.
4. Reserved-seat transport (bullet trains, airport express, ferries).
5. Accommodations.

**Render:**
- Booking tab shows ALL bookable items with direct links.
- `reservation: "needed"` items show a warning + link in the calendar (desktop and mobile).

---

## Currency Switcher

Pills determined by user's nationality + destination countries.

**Rules:**
- Include: home currency + each destination currency.
- Exclude USD unless user is American or destination uses USD.
- Default display matches user's home currency.

**Examples:**
| User | Destinations | Pills |
|------|--------------|-------|
| Taiwanese | Korea + Japan | TWD / KRW / JPY |
| American | Japan | USD / JPY |
| Japanese | Korea + Taiwan | JPY / KRW / TWD |

All prices show **destination currency (home equivalent)** — e.g., `W3,000 (NT$64)`, `¥1,500 (NT$300)`.

### Auto-switch with language (multi-lang only)

In single-lang mode (default), there's nothing to switch — set `currentCurr` to home currency on init. In multi-lang mode:

```js
const LANG_CURR_MAP = { zh: 'TWD', en: 'USD', ko: 'KRW', ja: 'JPY' };
function applyLang() {
  // ... existing code ...
  const mapped = LANG_CURR_MAP[currentLang] || currentCurr;
  if (currentCurr !== mapped) {
    currentCurr = mapped;
    document.querySelectorAll('.curr-btn').forEach(b => b.classList.toggle('on', b.dataset.curr === currentCurr));
  }
}
```

Map values to actual trip currencies. If a lang maps to a currency not in pills, fall back to home currency.

---

## Development Server (`serve.py`)

The generated folder includes a Python dev server (Leaflet + `fetch` need HTTP, not `file://`):

```python
import os, http.server, socketserver
os.chdir(os.path.dirname(os.path.abspath(__file__)))
with socketserver.TCPServer(('', 8765), http.server.SimpleHTTPRequestHandler) as s:
    print('Trip planner running at http://localhost:8765')
    s.serve_forever()
```

Plus `.claude/launch.json`:
```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "trip-planner",
      "runtimeExecutable": "python3",
      "runtimeArgs": ["serve.py"],
      "port": 8765
    }
  ]
}
```

Tell the user: `python3 serve.py`, then open `http://localhost:8765`.

Note: `index.html` also embeds a `<script id="trip-data" type="application/json">` fallback so the page works under `file://` too — but the dev server is the recommended path.
