---
name: trip-html-generator
description: >
  Generates a complete interactive HTML travel guide from researched trip data.
  Produces a multi-file folder (index.html + style.css + app.js + data/trip.json)
  with full i18n support, interactive maps, calendar views, expense tracking,
  and booking comparison.
  Trigger phrases: "generate the trip HTML", "create the travel guide",
  "build the interactive trip plan page", "generate the HTML for my trip",
  "create the trip planner app", "build the travel plan website"
---

# Trip HTML Generator

Generate a complete trip planner app as a **multi-file folder structure** (`index.html` + `style.css` + `app.js` + `data/trip.json`).

**`data/trip.json` is the single source of truth.** `index.html`, `style.css`, and `app.js` are a generic shell — the same shell across every trip — and contain ZERO trip-specific strings, prices, city names, or hardcoded data. Updating a trip = editing `trip.json` only.

> **Reference documents — read all of these before generating:**
> - **[references/phase-5-generation-strategy.md](references/phase-5-generation-strategy.md)** — MANDATORY: output path rule, incremental section-by-section build, checkpoint/resume. Read this FIRST.
> - **[references/template-contract.md](references/template-contract.md)** — MANDATORY rules: what may and may not appear in HTML/CSS/JS, plus the validation checklist
> - **[references/index-skeleton.md](references/index-skeleton.md)** — the canonical `index.html` shell (copy verbatim, fill `__TRIP_JSON__`)
> - **[references/app-skeleton.md](references/app-skeleton.md)** — the canonical `app.js` shape (bootstrap, `t(key)`, `L(obj)`, `cityById`, render dispatch)
> - [references/trip-json-schema.md](references/trip-json-schema.md) — full `trip.json` schema (`lang`, `supportedLangs`, `cities`, `i18n`, `weather`, `booking`, `entryForms`, `retro`, …)
> - [references/layout-blueprint.md](references/layout-blueprint.md) — layout structure, visual design system, CSS reference, responsive breakpoints
> - [references/html-content-sections.md](references/html-content-sections.md) — tab-specific markup and content requirements

## Generation Order (strict — see [phase-5-generation-strategy.md](references/phase-5-generation-strategy.md) for the full incremental flow)

**DO NOT write all four files in one shot.** That causes timeouts and truncation. Instead:

0. **Determine output path:** `{cwd}/{destination-slug}-{year}/`. Run `pwd` once, confirm with user. NO bracket-corrupted paths, NO invented parent folders. See strategy doc §A.
1. **Build `data/trip.json` in 5 sections (B1–B5)** — skeleton → i18n → POIs → schedule → auxiliary. Run `validate-trip.mjs --schema-only` after each section. See strategy doc §B.
2. **Generate `app.js` from `app-skeleton.md` in 8 function groups (C1–C8)** — bootstrap first as a full Write, then **append** each render group via Edit (do NOT rewrite the whole file each time). Bootstrap functions (`t()`, `L()`, `cityById()`, etc.) must match the skeleton verbatim. Every visible string goes through `t(key)` or `L(obj)`. See strategy doc §C.
3. **Copy `index-skeleton.md` verbatim** to `index.html`. Replace `__TRIP_JSON__` with the JSON-stringified trip payload (same bytes as `data/trip.json`).
4. **Generate `style.css`** from the chosen UI style (Phase 4.5 selection) + the layout-blueprint design tokens. Use generic class names; city colors come from `--city-color` CSS variables, never per-city selectors.
5. **Run the full validator** against the output folder. **MUST exit 0 before you report the trip as generated.**

```bash
node skills/trip-html-generator/scripts/validate-trip.mjs <trip-folder>                  # full check (final)
node skills/trip-html-generator/scripts/validate-trip.mjs <trip-folder> --schema-only    # mid-build check (after each B-section)
```

**Track progress in `data/trip.json._progress.phase5_step`** so an interrupted run can resume without re-doing earlier sections. See strategy doc §E.

The validator enforces: required files present, schema shape, `i18n` covers all `supportedLangs` × required keys, every `pois[]/schedule[]/weather[]` `city` references `cities[].id`, `index.html`/`app.js`/`style.css` contain ZERO trip-specific tokens (city display names, destination, tagline, POI names, currency codes), no per-city CSS selectors, no module-scope literal arrays (`WEATHER_DATA`, `POIS`, `SCHEDULE`), no language ladders (`lang === 'zh' ? ... : ...`).

If the validator reports failures: regenerate the offending file. Do not ship a violating trip.

---

## Tab Anatomy (MANDATORY — do not invent your own layout)

The 7 tabs each have a fixed responsibility. Do **not** merge them, do **not** put map/POI list on the Overview tab, do **not** create new tabs. The full mount-point list is in [index-skeleton.md](references/index-skeleton.md); summary:

| Tab id              | Sidebar icon         | Purpose                                              | Required mount points                                                                                       |
|---------------------|----------------------|------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| `tab-attractions`   | `travel_explore`     | Trip summary: header, stats, countdown, today card, weather strip | `#trip-destination` `#trip-meta` `#trip-tagline` `#stats-bar` `#info-box` `#time-countdown` `#today-card` `#weather-strip` |
| `tab-calendar`      | `calendar_month`     | Day-by-day grid + mobile fallback                    | `#calendar-desktop` `#calendar-mobile`                                                                      |
| `tab-booking`       | `sell`               | Flights, hotels, tickets, passes, recommended buys   | `#flight-intel` `#booking-purchased` `#booking-compare` `#booking-recommended` `#holiday-calendar`          |
| `tab-budget`        | `wallet`             | Estimated/actual toggle, charts, line items          | `#budget-mode-toggle` `#budget-total` `#budget-by-city` `#budget-by-cat` `#budget-detail`                   |
| `tab-time`          | `map`                | **Spots / Map** — filters + Leaflet map + POI list   | `#poi-filters` `#map` `#poi-list`                                                                           |
| `tab-checklist`     | `checklist`          | Entry forms + pre-trip checklist + nomad spots       | `#entry-forms` `#checklist-groups` `#nomad-workspaces`                                                      |
| `tab-retro`         | `auto_stories`       | Post-trip retrospective (hidden until `endDate` passes) | `#retro-map` `#retro-budget-review` `#retro-missed` `#retro-changelog` `#retro-lessons`                  |

### Hard rules

1. **`#map` exists in exactly ONE place: inside `#tab-time` (Spots/Map tab).** Never inside Overview, never duplicated. Leaflet's `L.map('map')` will silently bind to the first occurrence — putting one in Overview AND Spots breaks both tabs.
2. **POI list lives in `#tab-time`.** Overview shows a stat count (`#stats-bar`), not the full list.
3. **Calendar grid lives in `#tab-calendar`.** Overview shows the **today card** (today's events only) at `#today-card`, not the full calendar.
4. **Each tab section is `<section class="tab-panel" id="tab-{id}">`.** Use `class="active"` for the initially-visible tab. Switching is `app.js → showTab(id)` — generic, no per-tab logic.
5. **The retro tab is hidden until `new Date() >= new Date(TRIP.endDate)`.** Do not show it before the trip ends.
6. **Cover overlay and Today overlay** (if you choose to include them) are top-level `<div>` siblings of `<main>`, not inside any tab. They overlay the entire app on initial load and are dismissed via buttons.

If the generated HTML places `#map` outside `tab-time`, or skips any required mount point, the validator fails the build.

---

### Data Language Rule (MANDATORY — single format)

**Every user-visible text field is a nested i18n object. NEVER a bare string. NEVER `field` + `field_en` siblings.**

```json
✅ GOOD (single-lang, default):  { "name": { "zh": "淺草寺" } }
✅ GOOD (multi-lang, opt-in):    { "name": { "zh": "淺草寺", "en": "Senso-ji" } }
❌ BAD:  { "name": "淺草寺", "name_en": "Senso-ji", "name_ja": "浅草寺" }   // flat-sibling
❌ BAD:  { "name": "淺草寺" }                                                // bare string
```

**Why:** the runtime resolver `L(obj)` (defined in [app-skeleton.md](references/app-skeleton.md)) reads `obj[currentLang]` first, falls back to default lang then English. Passing a flat-sibling shape makes it return the bare object — which renders as `[object Object]` in the UI. Bare strings can't be translated.

Read [trip-json-schema.md §MANDATORY i18n Format](references/trip-json-schema.md) for the complete list of i18n-required fields and forbidden patterns.

### Required Languages (single-language by default)

**Default: emit ONE language only — the language the user is conversing with you in.**

- `lang` = user's conversation language (e.g., `"zh"` for a Traditional-Chinese-speaking user)
- `supportedLangs` = `[lang]` (a single-element array)
- Every i18n object holds exactly one key — that lang. Example: `{ "name": { "zh": "淺草寺" } }`
- Place names: write the local-language name directly under the user's lang key (e.g., a Taiwanese user visiting Japan gets `{ "zh": "淺草寺" }` not separate `ja` translations).
- The language switcher UI in `index.html` still renders, but with one pill. That's fine — the validator and renderer work unchanged.

**Why single-lang:** translating every POI/event/UI string into 4 languages adds thousands of tokens to `trip.json` for zero user benefit (the user only reads one language). Multi-lang is a feature the user can opt into later by adding more `supportedLangs` entries and translations.

**Multi-lang is opt-in only.** Only emit multiple languages if the user explicitly asks ("我要中英文都有" / "include English"). In that case, follow the original rule: include user's lang + English + destination language(s), e.g. `["zh", "en", "ja"]`.

The nested-i18n object structure (`{ "name": { "zh": "..." } }`) is still mandatory — do NOT use bare strings. The validator's flat-sibling check (`name_en`, `name_ja`) still applies. We're keeping the shape, just shrinking the content.

### UI Chrome Translations

Every UI string the user reads (tab labels, buttons, headings, empty states, status badges, week labels) lives in `trip.i18n.{lang}.{key}`. The renderer accesses them via `t(key)`.

- The **list of required keys** is in [app-skeleton.md §Required `i18n` keys](references/app-skeleton.md). Phase 5 generator MUST emit a value for each key under every `supportedLangs` entry.
- **NEVER hardcode UI text in `app.js` or `index.html`.** No `currentLang === 'zh' ? '中文' : 'English'`. No `<button>概覽</button>`. Use `t('tab.today')` and `<button data-i18n="tab.today"></button>`.
- The validator catches both: it warns on language ladders in JS and errors on trip-display tokens in HTML/CSS/JS.

#### Fonts (MANDATORY)

**All text on the entire site MUST use a unified font stack** that supports all languages:

```css
--font: 'Noto Sans TC', 'Noto Sans JP', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
```

Include Google Fonts import in `<head>`:
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;600;700&display=swap">
```

**No element may override font-family** except the Material Symbols icon font. The clock digits, stat numbers, calendar time slots -- ALL must use `var(--font)`.

#### Meal Tracking & Reservation (MANDATORY)

Every food event in the schedule MUST include:
```json
{
  "restaurant": "자갈치시장 2층 횟집",
  "map": "https://www.google.com/maps/search/?api=1&query=자갈치시장+부산",
  "reservation": false
}
```
- `restaurant`: local-language restaurant name
- `map`: Google Maps search URL
- `reservation`: `false` (no reservation needed), `"needed"` (needs booking), or `true` (confirmed)

The calendar renderer shows this info:
- Desktop: restaurant_name with map link inside the event block
- Mobile: restaurant_name with Map link + reservation status icon

#### Booking Links (MANDATORY -- all bookable items must include links)

**Every event that requires advance booking MUST include a `booking_url` field** with the direct link to the official reservation system or the best booking platform. This applies to:

1. **Attractions with timed entry / capacity limits** (e.g., boat rides, observation decks, theme parks)
2. **Tours and day trips** (Klook, KKday, GetYourGuide, Viator, etc.)
3. **Restaurants that need reservations** (popular/upscale restaurants, reservation-only venues)
4. **Transport that requires advance booking** (bullet train reserved seats, airport express, ferries)
5. **Accommodations** (hotels, hostels, Airbnb)

**Schema for bookable events:**
```json
{
  "reservation": "needed",
  "booking_url": "https://eipro.jp/takachiho1/eventCalendars/index",
  "booking_note": "Reservations open at 09:00, 2 weeks in advance"
}
```

**During Phase 4 (Deep Research), for EVERY bookable item:**
1. Search for the official reservation system URL
2. Search for the booking window (how far in advance can you book?)
3. Search for cancellation policy
4. Compare official vs. Klook vs. KKday prices
5. Note which platform is cheapest

**In the generated HTML:**
- The booking tab MUST show all bookable items with direct links
- Items with `reservation: "needed"` show a warning in the calendar with a link
- Items with `booking_url` show a clickable link in both desktop and mobile calendar views

**Research template for each bookable item:**
```
{item_name}
  Official booking: {official_url}
  Klook: {klook_url} ({price})
  KKday: {kkday_url} ({price})
  Booking opens: {booking_window} (e.g., 2 weeks before at 09:00)
  Cancellation policy: {cancellation_policy}
  Recommendation: {recommendation}
```

**The final HTML booking tab must include ALL of these with clickable links.**

**Currency rule: the currency switcher buttons are determined by the user's nationality and the trip's destination countries.**
- Include ONLY: **user's home currency** (from passport/nationality) + **each destination country's currency**
- Do NOT include USD unless the user is American or a destination uses USD
- Default display = matches the default language (see LANG_CURR_MAP below)
- Example: Taiwanese user going to Korea + Japan -> pills: TWD / KRW / JPY (no USD)
- Example: American user going to Japan -> pills: USD / JPY
- Example: Japanese user going to Korea + Taiwan -> pills: JPY / KRW / TWD
- Multi-destination trips include all destination currencies (e.g., Korea->Japan = KRW + JPY)
- All prices throughout the HTML show **destination currency (home currency equivalent)**
  e.g., "W3,000 (NT$64)" or "Y1,500 (NT$300)"

**Auto-switch currency with language (only relevant in multi-lang mode):**
In single-language mode (default), there's nothing to switch — just set `currentCurr` to the home currency on init and skip the auto-switch logic. In multi-lang mode, when the user switches language, the currency MUST auto-switch to the corresponding currency. Implement via a `LANG_CURR_MAP` and apply it in `applyLang()`:
```js
const LANG_CURR_MAP = { zh:'TWD', en:'USD', ko:'KRW', ja:'JPY' };
// In applyLang():
var mapped = LANG_CURR_MAP[currentLang] || 'TWD';
if (currentCurr !== mapped) {
  currentCurr = mapped;
  document.querySelectorAll('.curr-btn').forEach(b => b.classList.toggle('on', b.dataset.curr === currentCurr));
}
```
Adjust `LANG_CURR_MAP` values based on the actual trip currencies. If a language maps to a currency not in the switcher pills, map it to the closest relevant currency.

---

### Cover Page

Before the main tab interface, generate a **full-screen cover page** that serves as the entry
point to the travel guide. The cover page has:

1. **Full-screen photo background** -- the user can upload their own photo (stored in localStorage
   as base64), or a default gradient/solid color if no photo is uploaded
2. **Overlay text** -- trip title in large serif/bold font, dates, a tagline like
   "Explore Your Favorite Journey" or the trip description
3. **Upload button** -- small camera icon in the corner that opens a file picker to upload/change
   the cover photo. The photo is stored in `localStorage` so it persists across reloads.
4. **Swipe/scroll to enter** -- a "GO" button or upward arrow at the bottom. On click or swipe up,
   the cover page slides up to reveal the main interface below.
5. **Design:** full-bleed image, dark gradient overlay for text readability, centered text,
   smooth CSS transition (transform: translateY(-100vh)) when entering

```html
<!-- Cover page structure -->
<div id="cover" class="cover">
  <div class="cover-bg" id="cover-bg">
    <!-- Background image set via JS from localStorage or default -->
  </div>
  <div class="cover-overlay">
    <h1 class="cover-title">{trip title}</h1>
    <p class="cover-meta">{dates} · {days} days</p>
    <p class="cover-desc">{trip description}</p>
  </div>
  <div class="cover-bottom">
    <button class="cover-upload" onclick="uploadCover()">📷</button>
    <div class="cover-enter" onclick="enterApp()">
      <span class="cover-arrow">↑</span>
      <span>GO</span>
    </div>
  </div>
</div>
```

**CSS:** Cover is `position:fixed; inset:0; z-index:200;` -- sits above everything. When user
clicks GO or swipes up, add class `.cover-hidden` which does `transform:translateY(-100vh);
transition:0.6s ease;`. The main app content starts scrollable underneath.

**Photo upload:** Use `<input type="file" accept="image/*">`, read as base64 with FileReader,
store in `localStorage.setItem('trip-cover-photo', base64String)`. On page load, check
localStorage and set as background-image if exists.

---

### Today Dashboard (MANDATORY -- Today Page)

A **full-screen overlay** that appears FIRST when the user opens the site, BEFORE the cover page or main tab interface. It's context-aware based on the current date and shows the user what they should be doing right now.

**Structure:** `<div class="today-overlay" id="today-overlay">` with `position:fixed; inset:0; z-index:200;`. Background is a travel photo with dark overlay for text readability. Dismiss with slide-up animation (`.today-overlay.hidden { transform:translateY(-100%); }`).

**Background:** Full-screen travel photo (Unsplash or user-uploaded) with `::before` dark overlay (`background:rgba(0,0,0,.55)`). All text is white.

#### CRITICAL: Date calculation must use LOCAL time, NOT UTC
```js
// CORRECT -- uses local timezone:
const today = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
// WRONG -- toISOString() uses UTC, causes wrong date in UTC+N timezones:
// const today = now.toISOString().slice(0,10);  // <- DO NOT USE
```

#### Mode switching logic -- BEFORE trip persists until first event starts:
```js
// On the departure date, show BEFORE trip countdown until the first event's start hour.
// Example: flight at 19:30 -> BEFORE trip shown all day until 19:30, then switches to DURING.
var firstEvStart = todaySchedule ? todaySchedule.events[0] : null;
var showBeforeTrip = now < tripStart || (today === TRIP.startDate && firstEvStart && nowHour < firstEvStart.sh);
if (showBeforeTrip) { /* BEFORE */ } else if (todaySchedule) { /* DURING */ }
```

#### Three modes:

**1. Before trip (countdown mode) -- centered layout:**
- Large countdown number (e.g., "2") + "days until departure"
- Shows **0** on the departure day itself (still counting down until first event)
- Trip destination name + tagline + date range
- **Entry requirements** -- pending items from `TRIP.entryRequirements` with links
- **"Things you can do now" todo list** -- context-aware based on days remaining:
  - `> 7 days`: Confirm flights, hotel, tickets, review itinerary
  - `<= 7 days`: Confirm tickets, hotel, install eSIM, check weather, review itinerary
  - `<= 3 days`: Pack bags, install eSIM, exchange currency, confirm tickets, confirm hotel, check weather
  - `<= 1 day` (includes departure day): Pack bags, check passport, install eSIM, exchange currency, charger/power bank, online check-in
- **"First event"** -- shows the first event of the trip (e.g., "Arrive Gimhae Airport - 19:55 landing")
- "Start your trip ->" button (glassmorphism style, `backdrop-filter:blur(12px)`)

**2. During trip (today mode) -- CENTERED glassmorphism layout (same as countdown):**
Uses the SAME `today-countdown` container and `today-todo-item` glassmorphism cards as the before-trip mode. Overall layout is **centered** (date, city name, cards all centered on screen). Card **content** is left-aligned via flexbox (icon + text rows). No style overrides needed -- just reuse the existing `today-countdown` class.

Layout:
- Today's date + day of week + Day number (e.g., "4/1 Wed - Day 3") -- shown via `today-countdown-label`
- City name in large bold text (`today-dest` class, translated via `translateCity()`)
- Event count (e.g., "3 events") via `today-status`
- **NOW/NEXT section** -- uses the SAME `today-todos` wrapper as time period sections (NOT a separate container). Label is `today-todos-label` ("NOW - Now" or "NEXT - Up next"), card is a standard `today-todo-item`. NOW card gets brighter bg (`rgba(255,255,255,.2)`). Shows current activity if in progress, otherwise next upcoming event, or "Free time". Uses smart icon (see below), `coffee` icon for free time.
- **Events grouped by time period** using `today-todos` sections (same as pre-trip todo sections):
  - Morning (`wb_sunny` icon): events with `sh < 12`
  - Afternoon (`wb_twilight` icon): events with `sh >= 12 && sh < 18`
  - Evening (`dark_mode` icon): events with `sh >= 18`
  - Empty periods are omitted
- Each event is a `today-todo-item` card showing: smart icon + event name + time range + note + restaurant info with Maps link
- **Crowd alert**: if the NEXT upcoming event has `crowd.crowd_level === "high"` AND the current
  time falls within its `crowd.peak_hours`, show a warning card above the event list:
  `"{attraction} is in peak hours right now. Consider {nearby cafe/shop from along-the-way
  recommendations} for 30-60 min first."` Use `groups` Material Symbol icon for the crowd indicator.
- Active event (currently in progress) gets brighter card bg: `background:rgba(255,255,255,.22)`
- "Enter trip planner ->" button at bottom (left-aligned)

**3. After trip (completed mode):**
- "Trip Completed" with flight icon
- Trip destination + stats summary

#### Smart icon selection -- flight-related events MUST use flight icon:
```js
// Check event name for flight/airport keywords -> use 'flight' icon
// Otherwise fall back to category icon mapping
var getEvIcon = function(ev) {
  // ev.name is a nested i18n object — concatenate ALL its values for keyword matching,
  // so the flight detector works regardless of which lang the event was authored in.
  var name = Object.values(ev.name || {}).join(' ').toLowerCase();
  if (name.match(/airport|flight|landing|takeoff|airplane|機場|空港|공항/)) return 'flight';
  var CAT_ICONS = {attraction:'attractions', food:'restaurant', cafe:'coffee',
    transport:'directions_transit', work:'laptop_mac', hotel:'hotel', shopping:'shopping_bag',
    personal:'bedtime'};
  return CAT_ICONS[ev.cat] || 'event';
};
```
This applies to BOTH the NOW/NEXT card and the timeline event items. Use `getEvIcon(ev)` everywhere instead of just `CAT_ICONS[ev.cat]`.

#### Icons: Use Material Symbols Outlined (M3), NOT emoji:
```js
var mi = function(name) { return '<span class="mi material-symbols-outlined" style="font-size:20px">' + name + '</span>'; };
// Pre-trip: luggage, badge, sim_card, currency_exchange, power, flight_takeoff,
//           confirmation_number, hotel, cloud, checklist, flight, travel_explore, open_in_new
// During:  flight, attractions, restaurant, coffee, directions_transit, laptop_mac, hotel,
//          shopping_bag, my_location, schedule, wb_sunny, wb_twilight, dark_mode
```

#### i18n: All text on the Today page MUST be translatable:
```js
// i18n keys -- values should NOT include the English prefix (e.g., today_now: {zh:'Now'} not {zh:'NOW - Now'})
// The English prefix (NOW/NEXT) is hardcoded in the template, i18n provides the local translation after " - "
today_days_left, today_enter, today_start, today_now, today_next, today_free,
today_events, today_ended, today_todo_title, today_first, today_entry_title,
today_morning, today_afternoon, today_evening,
todo_pack, todo_passport, todo_esim, todo_cash, todo_charger,
todo_checkin, todo_tickets, todo_hotel, todo_weather, todo_itinerary, todo_flights
```

#### Integration:
- `renderToday()` called first in `DOMContentLoaded` init
- `applyLang()` must call `renderToday()` so language changes update the Today page
- `dismissToday()` adds `.hidden` class for slide-up animation

---

### Overview Tab: Weather Data + Today Card + Weather Strip

The Overview tab (tab-attractions) contains a **today card** and **14-day weather forecast strip** below the stats and info box. These are rendered by `renderOverviewExtras()` which calls `renderTodayCard()` and `renderWeatherStrip()`.

#### Weather Data (in app.js)

Research weather forecasts during Phase 4 (Deep Research) and hardcode as `WEATHER_DATA` array in app.js:
```js
const WEATHER_DATA = [
  { date:'2026-03-30', icon:'rainy', hi:14, lo:9,
    desc:{zh:'陣雨'},   // single-lang default. Multi-lang: add more keys (en/ja/ko) only when supportedLangs has them.
    sunrise:'06:22', sunset:'18:40', city:'busan' },
  // ... one entry per trip day
];
```
- `icon`: Material Symbols icon name (`clear_day`, `partly_cloudy_day`, `rainy`, `grain`, `cloudy`)
- `desc`: i18n weather description object
- `sunrise`/`sunset`: local time strings (HH:MM)
- `city`: lowercase city key matching POI city field

#### City Theme Mapping (Material icons, NO emoji)
```js
const CITY_THEMES = {
  'CityNameInSchedule': { icon: 'park', label: 'CityName' },
  // icon = Material Symbols icon name for the city
};
```

#### Today Card Rendering (`renderTodayCard`)
- **Before trip:** Shows city icon + "Trip hasn't started yet" + Day 1 preview events
- **During trip:** Shows city icon + Day X + city name + weather row + events timeline
- **After trip:** Shows flight_takeoff icon + "Trip has ended" message
- Weather row: Material weather icon + temp + desc + sunrise (`wb_twilight`) + sunset (`nightlight`)
- Events timeline: colored dots per category + time + event name, `.past` events dimmed

#### Weather Strip Rendering (`renderWeatherStrip`)
- Horizontal scroll container with one card per day (14 cards)
- Each card: day number (D1-D14), date, Material weather icon, temp, description, sunrise/sunset, golden hour time
- Today's card highlighted with `border-color:var(--text)` + `box-shadow`
- Auto-scroll to today on render

#### Schedule City Name Mapping
Schedule data uses Chinese city names (e.g., '釜山', '阿蘇/熊本'). Use a mapping to i18n keys:
```js
const SCHEDULE_CITY_I18N = { '釜山': 'scity_busan', '阿蘇/熊本': 'scity_aso', ... };
function getScheduleCityName(city) {
  const key = SCHEDULE_CITY_I18N[city];
  return key ? t(key) : city;
}
```
Add corresponding i18n entries (`scity_busan`, `scity_aso`, etc.) for all schedule city names.

---

### Interactive Features (JavaScript)

All of these MUST work in the generated HTML:

```
Core:
- Estimated/Actual expense toggle -> switches all charts, totals, and detail lists
- Currency switcher pills -> update displayed amounts (home / dest / USD / EUR)
- Filter chips -> show/hide POIs by category or city
- Print-friendly mode (hides interactive elements, clean layout)
- Export to Google Maps: generate a shareable Google Maps link with all POIs as waypoints
- Export GeoJSON: download all POIs as GeoJSON file for external map tools
- NO dark mode toggle, NO floating action button (FAB)

Mobile Bottom Bar (Tab Bar):
- Maximum 5 visible tabs. If there are 6+ tabs, group overflow items under a "More" button (5th slot).
- "More" button opens a popup menu (absolute positioned above tab bar) listing overflow tabs.
- Clicking a More-menu item switches to that tab AND closes the menu.
- More button shows active state (accent color) when any overflow tab is active.
- ALL floating menus (More menu, language menu) close on a single document-level click handler.
  Do NOT use stopPropagation on menu containers -- only on the toggle button itself.
- Language toggle inside the More menu: clicking "Language" opens the language sub-menu;
  clicking any language option switches lang, closes lang menu, closes More menu.
  **Hide the "Language" entry entirely when `TRIP.supportedLangs.length <= 1`** (single-lang mode, the default).
- Tapping the More button closes any open lang menu first, then toggles the More menu.

Schedule / Calendar Tab:
- Desktop: Google Calendar-style week view -- days as columns, hours on Y-axis (60px/hour),
  sticky header with day name + number (current day gets inverted black indicator)
- Mobile: vertical list -- date left, event list right, black bar on event left edge
- Activity blocks are DRAGGABLE between days (HTML5 drag-and-drop)
- Each activity has a resize handle at the bottom to adjust duration
- "All day" events shown in header row, not time grid
- Work blocks shown in distinct style (if nomad mode)
- **Crowd indicator on each event block**: small badge in top-right corner of the calendar event:
  - `LOW` -- green dot (#4aad5b), font-size 0.6rem
  - `MED` -- amber dot (#e8964a)
  - `HIGH` -- red dot (#e8664a)
  - Hover/tap shows tooltip: "Best: 08:00-09:30 | Peak: 10:00-14:00 | Tip: go early"
  - Data source: `crowd.crowd_level` from the POI matching the event
- **Restaurant party-size badge on food events**: small icon after the restaurant name:
  - Solo-friendly: `person` icon (green)
  - Group-friendly: `groups` icon (green)
  - Mismatch warning: `warning` icon (amber) + tooltip explaining the issue

Expenses Tab:
- Mode toggle: [Estimated] [Actual] pill buttons at top
- Total panel: large amount with currency switcher (inverted black section)
  - Label changes per mode: "Estimated Total" / "Actual Total"
- City cost ratio: horizontal bars (always visible in both modes)
- Category breakdown: horizontal bars sorted by highest spend, colored per category
  - `budgetCatColorMap` MUST include ALL categories that appear in budget data, including `cafe`.
    Missing categories fall back to a 📌 emoji which looks broken. Required entries:
    `hotel`, `food`, `transport`, `attraction`, `shopping`, `cafe`, `other`, `personal`
  - Similarly, `catIconMap` in `renderBudgetActual()` must include `cafe:'local_cafe'`
- Detail list:
  - Estimated mode: flat rows (item + city + cost), no checkboxes
  - Actual mode: "Pre-purchased" group (budget items with purchased:true) + per-date groups with day totals
- All changes immediately update totals and charts when switching modes or currency
- **Stats card (`stat-total`) MUST always show actual spending** (not estimated) when actual data exists.
  Both `renderBudgetEstimated()` and `renderBudgetActual()` update `stat-total`, so `renderBudgetEstimated()`
  must call `getActualTotal()` and display that if > 0, falling back to the estimated total otherwise.

POI / Attractions Tab:
- Click POI -> opens a **detail modal popup** with:
  - Full name (Chinese + local name), address, hours, price, description
  - Category badge with color
  - **Crowd section** (if POI has `crowd` data):
    - Visual busyness bar chart (CSS horizontal bars, one per hour from opening to closing):
      each bar's width represents relative busyness (like Google Maps Popular Times).
      Color: green (low) -> amber (medium) -> red (high). Current hour highlighted if during trip.
    - "Best time" badge: green pill showing `crowd.best_visit_window`
    - "Avoid" badge: red pill showing `crowd.peak_hours`
    - Tips list from `crowd.tips[]`
    - Seasonal note if applicable
  - **Dining section** (if POI is food/cafe category and has `dining` data):
    - Party size suitability: icon badges -- `[Solo OK]` `[Couples]` `[Groups OK]` with
      green/amber/red coloring based on match with user's `companions` setting
    - Seating info: `dining.seating` text (e.g., "Counter 8 seats + 3 tables")
    - Wait time: `dining.wait_time_peak` / `dining.wait_time_offpeak`
    - Tips for user's party size (from `dining.tips_solo` or `dining.tips_group`)
    - Warning banner if restaurant doesn't match party size (amber background)
  - Social media search links: Google Maps, Google, Instagram (hashtag search), YouTube, Xiaohongshu
  - Also pans the Leaflet map to that location
- Color-coded dot by category
- Filter chips at top
- **Crowd filter**: in addition to category and city filters, add a crowd-level filter:
  `[All]` `[Low crowd]` `[Med]` `[High]` -- lets user see only low-crowd spots
- **Party-size filter** (for food/cafe POIs): `[All]` `[Solo OK]` `[Groups OK]` -- filters
  restaurants by suitability for the user's travel party
- **Alerts/Warnings**: POIs can have an optional `warnings` array in trip.json.
  Each warning is `{text: "Important notice", severity: "info|warn|danger"}`.
  If a POI has warnings:
  - Show a warning icon next to the POI name in the list AND in calendar events
  - Clicking the warning icon opens a small popup with the warning text
  - Example warnings: "Advance reservation required", "Cash only", "Closed on Mondays", "Crater may be closed due to weather"
  - In the detail modal, warnings are shown prominently at the top with colored background
- **Every POI has a Google Maps link** that opens in a new tab:
  `https://www.google.com/maps/search/?api=1&query={lat},{lng}&query_place_id={place_id}`
  or simpler: `https://www.google.com/maps/search/?api=1&query={place_name}+{city}`

Booking Table (below map in Attractions tab):
- Radio buttons per platform (Official / Klook / KKday) per attraction
- Selecting platform updates budget with that price
- City pass selection zeros out covered individual tickets
- All prices link to real product pages
```

---

### CRITICAL: Every Tab Must Be Fully Populated

**NEVER generate placeholder content, empty shells, or "TODO" sections.**

Every tab must contain REAL, complete data from the research phases:

- **Attractions tab**: ALL POIs with real names, addresses, prices, hours, Google Maps links

  **POI Completeness Rule (mandatory):** Every **named place** that appears in `schedule[].events[]` -- restaurants, cafes, temples, parks, shopping spots, anything with a proper name -- MUST have a corresponding entry in `pois[]` with accurate `lat`/`lng`. The map and POI list are driven exclusively by `pois[]`; if a place is only in the schedule events but not in `pois[]`, it will be **invisible on the map**.

  Enforcement checklist when editing the itinerary:
  1. Scan every schedule event that has `"restaurant"`, `"map"`, or a named `"name"` field
  2. Verify a matching `id` exists in `pois[]`
  3. If missing -> add a new POI entry immediately with `lat`, `lng`, `cat`, `city`, `desc`, `addr`
  4. Use IDs that group logically: `fc1`-`fcN` for city cafes, `j1`-`jN` for new region spots, etc.

- **Calendar tab**: ALL 14 days with every event, transit, meal, and work block filled in
- **Booking tab**: ALL purchased items with links, ALL price comparisons with real URLs
- **Expenses tab**: ALL cost items with real prices, working currency switcher, estimated/actual toggle, `purchased` flags on pre-bought items, `city` field on actual expense items
- **Time Allocation tab**: Real time allocation data calculated from the actual itinerary
- **Checklist tab**: ALL checklist items (visa, packing, apps, power, SIM, etc.) + ALL coworking spaces with real addresses and hours

If a tab doesn't have enough data to be useful, it should not exist. But if it exists, it must be **fully populated with real researched data**, not filler.

---

### POI Detail Modal (MANDATORY)

When the user clicks a POI in the list, open a **detail modal popup** showing full POI information:

```
+-- .poi-modal-overlay (fixed, inset:0, z-index:300, bg:rgba(0,0,0,.4))
|   +-- .poi-modal (centered card, max-width:480px, border-radius:var(--r))
|       +-- .poi-modal-close (x button, top-right)
|       +-- #poi-modal-content
|           +-- .poi-modal-header (category dot + name + nameLocal)
|           +-- .poi-modal-section (info rows)
|           |   +-- city - address
|           |   +-- hours
|           |   +-- price (home currency + local currency)
|           |   +-- description
|           |   +-- category badge (colored pill)
|           +-- .poi-modal-section "Search more"
|               +-- .poi-modal-links (horizontal scroll)
|                   +-- Google Maps (with favicon)
|                   +-- Google Search (with favicon)
|                   +-- Instagram (hashtag search)
|                   +-- YouTube (search)
|                   +-- Xiaohongshu (search)
```

**Behavior:**
- `openPOIModal(id)` -- find the POI from `TRIP.pois`, render modal content, and call `focusPOI(id)` to pan the map to that POI
- Close via: x button, clicking the overlay background, or pressing Escape
- Mobile: after clicking a POI, auto-scroll to the map (`scrollIntoView`)

---

### GeoJSON Export (MANDATORY)

The Overview tab header must include an "Export GeoJSON" button; clicking it downloads all POIs as a `.geojson` file:

```js
function initExport() {
  document.getElementById('btn-export-geojson').addEventListener('click', () => {
    const geo = {
      type: 'FeatureCollection',
      features: TRIP.pois.map(p => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: { name: p.name, nameLocal: p.nameLocal, description: p.desc, category: p.cat }
      }))
    };
    const blob = new Blob([JSON.stringify(geo, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'trip-{destination}.geojson';
    a.click();
  });
}
```

The file can be imported into Google My Maps, QGIS, Mapbox, etc.

---

### Live Clocks -- Dual-Timezone Live Clocks (MANDATORY)

On the Calendar tab header (right side), show live clocks and update every 30 seconds:

```
+-- .clock-wrap (destination timezone -- primary, larger)
|   +-- .cd-label "KR / JP"
|   +-- .cd-digits (HH : MM with HOUR/MIN sublabels)
+-- .clock-wrap (home timezone -- secondary)
    +-- .cd-label "Home"
    +-- .cd-digits (HH : MM)
```

**Implementation notes:**
```js
const DEST_TZ = 'Asia/Tokyo';   // destination timezone
const HOME_TZ = 'Asia/Taipei';  // passport/home timezone

function getTimeInTZ(tz) {
  return new Date().toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
}

function initClocks() {
  updateClocks();
  renderNowLine();
  setInterval(() => { updateClocks(); renderNowLine(); }, 30000);
}
```

- Timezones must be set automatically based on the countries covered by the trip
- i18n: `clock_dest` and `clock_home` labels must switch with language

---

### Now Line -- Calendar Current-Time Indicator (MANDATORY)

On the Calendar tab, show a red horizontal line indicating the current time for "today":

**Desktop:** an absolutely positioned red line + time label inside `.cal-day-col`
**Mobile:** insert a now-indicator (red dot + line + time label) inside `.cal-m-events`

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

- The time label must display the **destination timezone** (e.g., "14:32 JST"); use `toLocaleString` with `timeZoneName:'short'` to get the abbreviation
- Position: `top = (nowHour - HOUR_START) * 60` px (matches the 60px/hour calendar scale)
- Update position every 30 seconds

---

### Nomad Spots -- Workspace Recommendations (if digital nomad mode)

At the bottom of the Checklist tab, show recommended workspaces for digital-nomad mode:

```js
const NOMAD_SPOTS = [
  {
    name: 'Engineer Cafe',
    addr: '天神 · 赤煉瓦文化館1F',
    hours: '09:00–21:00',
    mapQuery: 'エンジニアカフェ+福岡',
    tags: ['nomad_free', 'nomad_wifi', 'nomad_power'],
    coverage: 'nomad_coverage'
  },
  ...
];
```

**Rendering:**
```
+-- .nomad-section
|   +-- .nomad-title (work icon + title + date range + local hours)
|   +-- .nomad-spots
|       +-- .nomad-spot x N
|           +-- .ns-name (workspace name)
|           +-- .ns-addr (address - Google Maps link)
|           +-- .ns-tags (free/wifi/power/hours/coverage pills)
```

- Use i18n keys for tags (e.g., `nomad_free`, `nomad_wifi`)
- Only render this section when the user has work days

---

### Booking Tab Flight Card -- Outbound/Return Route Visualization (MANDATORY)

Booked flights must render in the Booking tab as a **full-width flight card**, including outbound and return route visualizations:

```
+-- .booked-card.booked-card-wide.flight-card (grid-column:1/-1)
|   +-- .booked-card-head (airline name + booked badge)
|   +-- .flight-segments
|   |   +-- .flight-seg (outbound)
|   |   |   +-- .flight-seg-badge "Outbound"
|   |   |   +-- .flight-seg-body
|   |   |       +-- .flight-seg-route (departure -> arrival visualization)
|   |   |       |   +-- .flight-seg-point (time + city/terminal)
|   |   |       |   +-- .flight-seg-arrow (line + flight code + duration)
|   |   |       |   +-- .flight-seg-point (time + city/terminal)
|   |   |       +-- .flight-seg-detail (date - terminal links)
|   |   +-- .flight-seg (return) -- same structure with a "Return" badge
|   +-- .flight-footer (price + verdict badge)
|   +-- .flight-checkin-note (Web Check-in link + opening window)
```

**Required fields:**
- Flight number, date/time, airline
- Departure/arrival terminals (each terminal must include a Google Maps link)
- **Timezone-corrected flight duration** (see layout-blueprint.md Non-Negotiable Rule #22)
- Web check-in link + check-in window (e.g., "48hr - 1hr before departure")
- Flight verdict inline badge (green/yellow/red rating from `flightIntel`)

---

### Development Server -- serve.py

The generated folder must include a simple Python dev server for local preview (`fetch` requires an HTTP server):

```python
import os, http.server, socketserver
os.chdir('{project_directory}')
with socketserver.TCPServer(('', 8765), http.server.SimpleHTTPRequestHandler) as s:
    s.serve_forever()
```

Also include a preview server config in `.claude/launch.json`:
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

Tell the user: run `python3 serve.py`, then open `http://localhost:8765`.

---

### Output

Output must be a multi-file folder structure (**not** inline / single-file):

```
{destination}-{year}/
+-- index.html          <- HTML structure + inline JSON fallback
+-- style.css           <- all CSS (separate file; not inline)
+-- app.js              <- all JS logic (separate file; not inline)
+-- data/
|   +-- trip.json       <- trip data (canonical copy)
+-- serve.py            <- local dev server
+-- .claude/
    +-- launch.json     <- preview config
```

**External dependencies (CDN):**
- Leaflet CSS + JS (unpkg CDN) -- maps
- Google Fonts (Noto Sans TC/JP/KR + Material Symbols Outlined) -- fonts + icons

**Charts must be pure CSS bar charts (no Chart.js).**

**`index.html` must include an inline JSON fallback via `<script id="trip-data" type="application/json">`**, so the page still works under the `file://` protocol (where `fetch` fails).

Tell the user the output folder path and suggest: `python3 serve.py` -> `http://localhost:8765`.
