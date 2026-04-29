### Trip Data Schema — Sharded Layout (MANDATORY)

Trip data is sharded across multiple files in `data/`. The renderer (`app.js → loadTrip()`) fetches them in parallel and merges into a single `TRIP` object — the schema below describes that **merged object's shape**, which is also what the validator checks. Use it as the contract; the on-disk layout is:

| Shard file | Top-level fields it provides |
|------------|-------------------------------|
| `data/trip.meta.json` | `lang`, `supportedLangs`, `destination`, `tagline`, `startDate`, `endDate`, `currency`, `cities`, `i18n` |
| `data/pois.json` | array → merged as `pois` |
| `data/schedule.json` | array → merged as `schedule` |
| `data/weather.json` | array → merged as `weather` |
| `data/budget.json` | object → merged as `budget` |
| `data/booking.json` | object → merged as `booking` |
| `data/checklist.json` | array → merged as `checklist` |
| `data/flightIntel.json` (optional) | object → merged as `flightIntel` |
| `data/entryRequirements.json` (optional) | array → merged as `entryRequirements` |
| `data/entryForms.json` (optional) | array → merged as `entryForms` |
| `data/holidays.json` (optional) | object → merged as `holidays` |
| `data/retro.json` (optional) | object → merged as `retro` |

The merged schema (every field below is required in the runtime `TRIP` object unless explicitly marked optional):

> **Single-language is the default. Multi-language is opt-in only** — only include multiple `supportedLangs` if the user explicitly asks (e.g. "我要中英文"). See SKILL.md §Required Languages.
>
> **Reading the examples below:** most i18n object examples in this document show 4 languages (`zh`/`en`/`ja`/`ko`) for completeness. **In single-lang mode (the default), each i18n object holds exactly ONE key — the user's conversation language.** Example: a Traditional-Chinese user gets `{ "name": { "zh": "釜山" } }`, not `{ "name": { "zh": "釜山", "en": "Busan", "ja": "釜山", "ko": "부산" } }`. The 4-language examples illustrate shape only; do not copy them verbatim into a single-lang trip.json.

```json
{
  "lang": "zh",
  "supportedLangs": ["zh"],
  "destination": "釜山→阿蘇→福岡",
  "tagline": {
    "zh": "在櫻花盛開的季節，從海邊城市走進火山秘境"
  },
  "startDate": "2026-03-30",
  "endDate": "2026-04-12",
  "currency": {
    "home": "TWD",
    "rates": { "KRW": 42, "JPY": 5, "USD": 0.031 }
  },
  "cities": [ ... ],
  "i18n": { ... },
  "weather": [ ... ],
  "entryRequirements": [ ... ],
  "entryForms": [ ... ],
  "flightIntel": { ... },
  "holidays": { ... },
  "pois": [ ... ],
  "schedule": [ ... ],
  "budget": { "items": [ ... ] },
  "booking": { ... },
  "checklist": [ ... ]
}
```

**Template contract:** `index.html` (including its inline `<style>` block) and `app.js` must contain ZERO trip-specific strings. There is no separate `style.css`. Everything visible to the user is sourced from the `data/*.json` shards. See [template-contract.md](template-contract.md).

---

### MANDATORY i18n Format — Read This First

**Every user-visible text field is a nested i18n object, ALWAYS** — even in single-language mode (the default). The wrapper preserves the option to add languages later without rewriting the data.

```json
// Single-lang mode (default — user converses in zh):
{ "name": { "zh": "淺草寺" } }

// Multi-lang mode (opt-in only — user explicitly asked for English too):
{ "name": { "zh": "淺草寺", "en": "Senso-ji" } }
```

Affected fields (non-exhaustive): `tagline`, `cities[].name`, `pois[].name`, `pois[].desc`, `pois[].nameLocal`, `pois[].addr`, `schedule[].events[].name`, `schedule[].events[].note`, `schedule[].events[].restaurant`, `budget.items[].name`, `budget.actual_expenses[].name`, `checklist[].title`, `checklist[].items[]`, `entryRequirements[].name`, `entryRequirements[].items[].task`, `entryRequirements[].items[].deadline`, `entryForms[].title`, `entryForms[].fields[].label`, `booking.purchased[].name`, `booking.compare[].name`, `booking.recommended[].name`, `booking.passes[].name`, `holidays.items[].name`, `retro.what_went_well[].note`, `retro.where_overspent[].note`, `retro.changelog[].description`, `retro.changelog[].lesson`, `retro.planning_lessons[]`.

**FORBIDDEN — do NOT use these legacy formats:**

```json
// ❌ Flat sibling keys
{ "name": "淺草寺", "name_en": "Senso-ji", "name_ja": "浅草寺" }

// ❌ Bare string for a localized field
{ "name": "淺草寺" }

// ❌ Mixing both
{ "name": "淺草寺", "desc": { "zh": "...", "en": "..." } }
```

**Why this matters:** the runtime resolver `L(obj)` expects a nested i18n object. Passing a bare string makes it unable to switch languages; passing a sibling-key flat shape breaks because the renderer sees `obj.desc` as a plain object and falls back to `String(obj)` → `"[object Object]"` in the UI. **One format, no exceptions.** If a value genuinely has no translations, still wrap it: `{ "en": "Tigerair" }`.

**Required keys per i18n object:** every value listed in `supportedLangs`. In single-lang mode that's just one key. The validator checks coverage against whatever `supportedLangs` declares — declare fewer langs, you write fewer translations.

---

#### `lang` / `supportedLangs` -- Language Configuration

```json
"lang": "zh",
"supportedLangs": ["zh"]
```

- `lang`: the user's conversation language (also the default display language).
- `supportedLangs`: defaults to `[lang]` (single-language mode). The language switcher hides itself when `supportedLangs.length <= 1`.
- **Multi-lang is opt-in.** Only add more entries if the user explicitly requests additional languages (e.g. "我要中英文"). When opted-in, follow: user's lang first, then English, then destination language(s) — e.g. `["zh", "en", "ja"]` for a Taiwanese user visiting Japan.

#### `cities[]` -- City Registry (replaces hardcoded city CSS)

```json
"cities": [
  { "id": "busan",   "name": { "zh": "釜山", "en": "Busan",   "ko": "부산",   "ja": "釜山"   }, "color": "#3a7bd5", "icon": "beach_access" },
  { "id": "aso",     "name": { "zh": "阿蘇", "en": "Aso",     "ko": "아소",   "ja": "阿蘇"   }, "color": "#2e7d32", "icon": "landscape" },
  { "id": "fukuoka", "name": { "zh": "福岡", "en": "Fukuoka", "ko": "후쿠오카","ja": "福岡"  }, "color": "#c0392b", "icon": "ramen_dining" }
]
```

- `id`: lowercase ASCII slug. Referenced from `pois[].city`, `schedule[].city`, `weather[].city`, etc.
- `name`: i18n object for display in any language
- `color`: hex color string. Injected as `--city-color` CSS variable at render time. **Never written into stylesheets.**
- `icon`: Material Symbols Outlined icon name

#### `i18n` -- UI Chrome Translations

Every UI label that the user reads (tab names, button text, headings, empty states) lives here keyed by ID. `app.js` exposes `t(key)` that resolves against the active language.

```json
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
    "label.estimated": "預估",
    "label.actual": "實際",
    "empty.no_events": "今天沒有安排"
  },
  "en": {
    "tab.today": "Today",
    "tab.spots": "Spots",
    "tab.calendar": "Calendar",
    "tab.budget": "Budget",
    "tab.booking": "Booking",
    "tab.checklist": "Checklist",
    "label.total": "Total",
    "label.booked": "Booked",
    "label.estimated": "Estimated",
    "label.actual": "Actual",
    "empty.no_events": "Nothing scheduled today"
  }
}
```

- Required keys: every label rendered by `app.js` must have an entry under every `supportedLangs` value.
- Adding a new language = append a new block here. **No JS changes needed.**
- Use dot-notation keys (`tab.today`, `label.total`) — flat object, no nesting.

#### `weather[]` -- Per-Day Weather Strip

```json
"weather": [
  { "date": "2026-03-30", "city": "busan", "icon": "clear_day", "high": 18, "low": 9, "sunrise": "06:34", "sunset": "18:42", "note": "Clear" },
  { "date": "2026-03-31", "city": "busan", "icon": "partly_cloudy_day", "high": 17, "low": 11, "note": "" }
]
```

- `city`: must reference a `cities[].id`. Render layer looks up color and name from there.
- `icon`: Material Symbols name (`clear_day`, `partly_cloudy_day`, `rainy`, `grain`, `cloudy`)


#### `entryRequirements[]` -- Entry Form Prefill Tasks

One entry per visited country, containing any online entry forms the user must complete:

```json
"entryRequirements": [
  {
    "country": "KR",
    "name": { "zh": "🇰🇷 韓國", "en": "🇰🇷 Korea", "ko": "🇰🇷 한국", "ja": "🇰🇷 韓国" },
    "items": [
      {
        "task": { "zh": "電子入境卡 e-Arrival Card", "en": "e-Arrival Card", "ko": "전자입국카드", "ja": "電子入国カード" },
        "url": "https://www.e-arrivalcard.go.kr/",
        "deadline": { "zh": "3/27 起可填（抵達前3天）", "en": "From 3/27 (3 days before arrival)", ... },
        "status": "pending"
      }
    ]
  },
  {
    "country": "JP",
    "name": { "zh": "🇯🇵 日本", "en": "🇯🇵 Japan", ... },
    "items": [
      {
        "task": { "zh": "Visit Japan Web", "en": "Visit Japan Web", ... },
        "url": "https://www.vjw.digital.go.jp/",
        "deadline": { "zh": "出發前隨時可填", "en": "Fill anytime before departure", ... },
        "status": "pending"
      }
    ]
  }
]
```

- `status`: `"pending"` | `"done"` -- user can check items in the Today overlay and Checklist tab
- Only include **items that require an online form** (e.g., e-Arrival Card, Visit Japan Web, ESTA). Put generic reminders in the checklist.

#### `flightIntel` -- Flight Price History Analysis

Used for flight price evaluation in the Booking tab and flight info in the Today overlay:

```json
"flightIntel": {
  "route": "TPE ↔ PUS/FUK",
  "userPrice": 19600,
  "booked": true,
  "monthlyPrices": [
    { "month": "4月", "label": "Apr", "avg": 14500, "note": "淡季尾" },
    { "month": "5月", "label": "May", "avg": 15200, "note": "" },
    ...
  ],
  "range": { "low": 12000, "high": 28000, "avg": 21750 }
}
```

- `userPrice`: the price the user actually paid (in home currency, e.g., TWD)
- `booked`: whether the flight is already purchased
- `monthlyPrices`: 12 months of historical averages for the price trend chart
- `range`: 12-month low/high/avg used to compute the verdict (green below avg / yellow near avg / red above avg)
- `renderFlightIntel()` renders the inline verdict badge on the Booking tab flight card

#### `holidays` -- Holiday Data

Holidays for the user's home country, used for the Booking tab holiday calendar and PTO-bridging tips:

```json
"holidays": {
  "country": "TW",
  "countryName": "台灣",
  "items": [
    {
      "date": "2026-04-03",
      "name": "清明節",
      "days": "4/2–4/5 四天連假",
      "tip": "請0天放4天",
      "active": true
    },
    { "date": "2026-05-01", "name": "勞動節", "days": "5/1（五）", "tip": "請0天放3天" },
    ...
  ]
}
```

- `active: true` marks holidays overlapping the trip dates
- `tip` provides PTO-bridging guidance (e.g., "Take X days off to get Y days total")

#### `pois[]` -- POI (Attractions) Data

```json
{
  "id": "b1",
  "name":      { "zh": "龍頭山公園+釜山塔", "en": "Yongdusan Park + Busan Tower", "ko": "용두산공원/부산타워", "ja": "龍頭山公園+釜山タワー" },
  "nameLocal": { "zh": "용두산공원/부산타워", "en": "용두산공원/부산타워", "ko": "용두산공원/부산타워", "ja": "용두산공원/부산타워" },
  "desc":      { "zh": "⭐必去 · 3/31 09:30-10:30 · ₩7,200", "en": "Must-visit · 3/31 09:30-10:30 · ₩7,200", "ko": "...", "ja": "..." },
  "addr":      { "zh": "南浦洞", "en": "Nampo-dong", "ko": "남포동", "ja": "南浦洞" },
  "city": "busan",
  "cat": "attraction",
  "icon": "temple_buddhist",
  "lat": 35.1008, "lng": 129.0325,
  "price_local": 7200,
  "currency": "KRW",
  "hours": "09:00–22:00"
}
```

- `city`: must reference a `cities[].id`. Used for filters and map marker grouping.
- `cat`: `attraction` | `food` | `cafe` | `shopping` | `transport` | `work` | `hotel` | `other`
- `icon`: Material Symbols Outlined name (e.g. `temple_buddhist`, `ramen_dining`, `museum`). Renderer reads from this — never hard-coded.
- `price_local` + `currency`: price in destination currency. The renderer converts to home currency via `currency.rates`. Replaces the legacy `price_krw`/`price_jpy`/`price_twd` flat keys.
- `nameLocal`: local-language name used in the destination country (for Google Maps search). Still an i18n object. Each lang key in `supportedLangs` holds the same local-language string (the destination's native script), since this is what gets pasted into Google Maps regardless of UI language.
- `hours`: kept as a single locale-neutral string (`HH:MM–HH:MM`) since hours don't need translation.

#### `schedule[]` -- Daily Itinerary

```json
{
  "date": "2026-03-31",
  "city": "busan",
  "events": [
    {
      "sh": 10, "eh": 12,
      "name": { "zh": "釜山電影體驗博物館", "en": "Busan Cinema Experience Museum", "ko": "부산영화체험박물관", "ja": "釜山映画体験博物館" },
      "cat": "attraction",
      "note": { "zh": "₩10,000 · 龍頭山旁 · 室內", "en": "₩10,000 · Next to Yongdusan · Indoor", "ko": "₩10,000 · 용두산 옆 · 실내", "ja": "₩10,000 · 龍頭山隣 · 室内" },
      "restaurant": { "zh": "국제시장 돼지국밥", "en": "Gukje Market Pork Soup", "ko": "국제시장 돼지국밥", "ja": "国際市場のテジクッパ" },
      "map": "https://www.google.com/maps/search/?api=1&query=...",
      "reservation": false,
      "booking_url": "https://...",
      "booking_note": { "zh": "出發兩週前開放預訂", "en": "Reservations open 2 weeks before" }
    }
  ]
}
```

- `sh`/`eh`: start/end time (decimal hours, e.g., 10.5 = 10:30) — use the day's city local timezone
- `city`: must reference a `cities[].id`. The renderer looks up the localized display name via `cityById(city).name` — **never** put a localized city display string here.
- `restaurant`/`map`/`reservation`: required for food events. `restaurant` is an i18n object.
- `booking_url`/`booking_note`: optional for items that require reservations. `booking_note` is an i18n object.

#### `budget.items[]` -- Budget Line Items

```json
{
  "name": { "zh": "機票來回 IT606+IT241", "en": "Round-trip Flights IT606+IT241", "ko": "왕복 항공권 IT606+IT241", "ja": "往復航空券 IT606+IT241" },
  "city": "busan",
  "cat": "transport",
  "cost_home": 19600,
  "purchased": true
}
```

- `cost_home`: amount in the user's home currency (`currency.home`). Replaces the legacy `cost_twd` field.
- `purchased`: `true` if the item is already booked/paid (shows in Booking tab "purchased" section + reduces remaining-budget calc). Replaces the legacy `checked` flag.
- For items with destination-currency pricing, additionally include `cost_local` + `currency`; the renderer prefers `cost_local`+`currency` and falls back to `cost_home`.

#### `budget.actual_expenses[]` -- Actual Spending Log

Used by the Stats bar (Overview tab) and the Budget tab "actual" mode. Empty before the trip starts; the user (or the planner in update mode) appends entries during the trip.

```json
"budget": {
  "items": [ ... ],
  "actual_expenses": [
    { "date": "2026-03-30", "name": { "zh": "機場巴士", "en": "Airport bus" }, "city": "busan", "cat": "transport", "cost_local": 7000, "currency": "KRW", "cost_home": 175 }
  ]
}
```

- `cost_local` / `currency`: spending in destination currency
- `cost_home`: pre-converted home-currency value (renderer can recompute via `currency.rates`)
- `cat`: same enum as `pois[].cat`

#### `booking` -- Booking Tab Content

```json
"booking": {
  "purchased": [
    {
      "type": "flight",
      "name": { "zh": "TPE → PUS", "en": "TPE → PUS" },
      "carrier": "Tigerair",
      "code": "IT606",
      "depart": { "place": { "zh": "桃園 T1", "en": "Taoyuan T1", "ko": "타오위안 T1", "ja": "桃園 T1" }, "date": "2026-03-30", "time": "16:55", "map": "https://www.google.com/maps/search/?api=1&query=Taoyuan+T1" },
      "arrive": { "place": { "zh": "金海 T1", "en": "Gimhae T1", "ko": "김해 T1", "ja": "金海 T1" }, "date": "2026-03-30", "time": "19:55", "map": "..." },
      "cost_home": 19600,
      "currency": "TWD",
      "url": "https://...",
      "verdict": { "label": "below_avg", "delta_pct": -12 }
    }
  ],
  "compare": [
    {
      "poi_id": "b1",
      "name": { "zh": "釜山塔", "en": "Busan Tower" },
      "platforms": [
        { "id": "official", "label": "Official", "price_local": 7200, "currency": "KRW", "url": "https://..." },
        { "id": "klook",    "label": "Klook",    "price_local": 6500, "currency": "KRW", "url": "https://...", "cheapest": true },
        { "id": "kkday",    "label": "KKday",    "price_local": 6800, "currency": "KRW", "url": "https://..." }
      ],
      "selected": "klook"
    }
  ],
  "passes": [
    { "name": { "zh": "釜山通行證" }, "price_local": 49000, "currency": "KRW", "covers_poi_ids": ["b1","b3","b5"], "url": "https://..." }
  ],
  "recommended": [
    { "kind": "esim", "name": { "zh": "韓國 eSIM 8天" }, "cost_local": 380, "currency": "TWD", "url": "https://..." },
    { "kind": "transit_card", "name": { "zh": "T-money" }, "url": "https://..." }
  ]
}
```

- `purchased[].type`: `flight` | `hotel` | `transport` | `tour` | `ticket`
- `verdict.label`: `below_avg` | `near_avg` | `above_avg` (drives the inline badge — translated via `t('flight.below_avg')` etc.)
- `compare[].selected`: which platform's price feeds into the budget tab
- `passes[].covers_poi_ids`: when a pass is selected, the renderer zeroes out individual ticket costs for these POIs

#### `entryForms[]` -- Pre-fill Data for Entry Forms

```json
"entryForms": [
  {
    "id": "kr-earrival",
    "title": { "zh": "韓國電子入境卡填表資料", "en": "Korea e-Arrival Card Pre-fill", "ko": "...", "ja": "..." },
    "url": "https://www.e-arrivalcard.go.kr/",
    "fields": [
      { "label": { "zh": "航空公司", "en": "Airline" }, "value": "TIGERAIR TAIWAN (IT)" },
      { "label": { "zh": "航班號碼", "en": "Flight No." }, "value": "IT606" }
    ]
  }
]
```

Renderer puts each form into a `<details>` block in the checklist tab; clicking any value copies it.

#### `retro` -- Post-Trip Retrospective

```json
"retro": {
  "verdict": { "status": "under_budget", "delta_home": -3200 },
  "what_went_well": [
    { "cat": "transport", "delta_home": -2100, "note": { "zh": "Nishitetsu Pass 省下 NT$2,100", "en": "Saved NT$2,100 with Nishitetsu Pass" } }
  ],
  "where_overspent": [
    { "cat": "shopping", "delta_home": 4500, "note": { "zh": "Olive Young 大採購", "en": "Olive Young haul" } }
  ],
  "missed_pois": [
    { "poi_id": "b7", "reason": "rain", "next_time": { "zh": "下次選晴天" } }
  ],
  "next_trip_seeds": [
    { "name": { "zh": "慶州" }, "near": "busan", "why": { "zh": "2小時車程，廟宇+古墳" } }
  ],
  "changelog": [
    { "date": "2026-04-02", "day": 3, "type": "swap", "description": { "zh": "Taejongdae 換 ARTE Museum", "en": "Swapped Taejongdae with ARTE Museum" }, "reason": "rain", "impact": "positive", "lesson": { "zh": "戶外天必備室內備案" } }
  ],
  "planning_lessons": [
    { "zh": "預留 2-3 小時緩衝時間", "en": "Leave 2-3hr buffer per day" }
  ]
}
```

- `verdict.status`: `under_budget` | `over_budget` | `on_budget` (drives badge text via `t('status.under_budget')`)
- `changelog[].impact`: `positive` | `neutral` | `negative` (drives timeline dot color)
- `changelog[].type`: `add` | `skip` | `swap` | `move`
- The retro tab is hidden until the current date passes `endDate`

#### `checklist[]` -- Pre-trip Checklist (Full i18n)

```json
[
  {
    "title": { "zh": "證件 & 簽證", "en": "Documents & Visa", "ko": "서류 & 비자", "ja": "書類 & ビザ" },
    "items": [
      {
        "label": { "zh": "護照有效期 6個月以上", "en": "Passport valid 6+ months", "ko": "여권 유효기간 6개월 이상", "ja": "パスポート有効期限6ヶ月以上" },
        "done": false,
        "url": null
      }
    ]
  }
]
```

- Each group has a `title` (i18n object) and `items[]` of `{ label, done, url? }`. The `label` is an i18n object — **never a bare string**.
- `done`: bool, persisted to `localStorage` keyed by group title + item label
- `url`: optional link (e.g., for Visit Japan Web). Renderer shows a link icon next to the label.
- Default groups: Documents & Visa, Finance & Exchange, Must-have Apps, Connectivity, Luggage & Clothing
