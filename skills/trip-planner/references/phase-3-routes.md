# Phase 3 — Plan Routes & Transit

About **geographic efficiency** — clustering nearby attractions and finding the best transit connections.

---

## Step 3a: Deep Transit Research

1. **Transit system overview**: metro/subway map + coverage; day-pass / multi-day pass with prices; IC card options (Suica, ICOCA, T-money) and where to buy; first/last train times
2. **Key transit hubs** — transfer points between attraction clusters:
   - `"{destination} major train stations"`, `"{destination} transfer stations"`
   - For each hub: lines converging, locker availability, nearby food
   - Tokyo example: Shinjuku (JR + Odakyu + Keio + Subway), Tokyo (JR + Subway + Shinkansen), Shibuya (JR + Tokyu + Ginza + Hanzomon)
3. **Area-to-area transit matrix**:

   | From → To | Route | Time | Cost |
   |-----------|-------|------|------|
   | Asakusa → Shinjuku | Ginza → Marunouchi | 30 min | Y280 |
   | Shinjuku → Harajuku | JR Yamanote | 4 min | Y150 |

4. **Airport ↔ city** — research the SPECIFIC airport: express, shuttle, taxi, shared transfer; prices, times, frequency
5. **Inter-city** (multi-city trip): bullet train / express / bus / domestic flight; advance booking? pass options (JR Pass, KR Pass) — calculate worthwhile
6. **Local within areas**: walkable vs transit, useful buses/trams/ferries, rental bike/scooter
7. **Weather forecast for trip dates (MANDATORY):**
   - `"{destination} weather forecast {month} {year}"`, `"{destination} weather {date range}"`
   - Per day: high/low, condition (sunny/cloudy/rainy), sunrise/sunset
   - Identify rainy days → indoor activities; clear days → outdoor/sunset/nature
   - Note seasonal events: cherry blossom timing, festivals, typhoon season
   - This data populates the `weather` field in trip.json AND informs route optimization

---

## Step 3b: Day-by-Day Route Plan

> **Day 1 (4/5 Sat) — Asakusa & Ueno**
>
> | Time | Activity | Transit | Crowd |
> |------|----------|---------|-------|
> | 10:30 | Arrive Narita | — | — |
> | 11:00–12:10 | Narita → Asakusa | Skyliner→Nippori, transfer subway, 70min, Y2,520 | — |
> | 12:30 | Check-in / drop luggage | Walk 5min | — |
> | 13:00–14:30 | Senso-ji + Nakamise | Walk 8min | [MED] Midday but manageable weekdays |
> | 14:30–16:00 | Tokyo Skytree | Walk 15min | [LOW] Post-lunch dip |
> | 16:30–17:30 | Ueno Ameyoko Market | Subway 10min, Y170 | [MED] Thins after 16:00 |
> | 18:00 | Dinner: Daikokuya Tempura | Walk 3min | [LOW] Pre-rush slot |
>
> **Today's transport: Y2,690** (35% of total budget)

**Every day must include:**
- Respect flight times + hotel check-in/out
- Start/end near hotel, or show route back
- Fixed/pre-booked items first, fill gaps
- **Every location change has explicit transit**: mode, line, time, cost
- **Daily transport subtotal** for day-pass decision
- **Crowd-aware (MANDATORY):**
  - Crowd column on every row: `[LOW]` / `[MED]` / `[HIGH]` + one-line context
  - **Intra-day ordering**: schedule popular attractions during off-peak hours. Off-peak early morning → first. Off-peak late afternoon → last. Fill middle with low-traffic spots.
  - **Restaurant timing**: lunch avoid 12:00–13:00 → 11:30 or 13:30; dinner avoid 18:00–19:30 → 17:30 or 20:00
  - Two same-day off-peak overlaps → FLAG: "Senso-ji and Tsukiji both best before 09:00 — split across two days"
- **Transit pass analysis**: "5 rides Y1,100, day pass Y600 → save Y500"
- **Transfer hub highlights**: locker + food tips
- Flag too packed (>5) or too empty (<2)
- **Weather-aware (MANDATORY):**
  - Outdoor (beaches, parks, viewpoints, hiking) → sunny days
  - Indoor (museums, shopping, arcades, spas) → rainy/overcast
  - Sunset/sunrise → clearest forecast
  - Rain expected: indoor alternatives + "Rain expected — indoor prioritized"
  - Must-visit outdoor on rainy day: "Rain Day 3 — swap Gwangalli (Day 3) with ARTE Museum (Day 4)"
  - Store in trip.json `weather` array
  - On later changes, **always check weather** before suggesting day swaps
- **Time conflict detection**: same time-of-day clashes → FLAG ("Cheongsapo Sunset Bridge and Gwangalli Night View both dusk — split")
- **Meal suggestions** near each cluster with specific restaurant names
- **Along-the-way recommendations**: small discoveries on the route between main attractions:
  - Notable shops/bakeries/cafes near transit or walking paths
  - Photo spots or street art
  - Vintage/crafts/specialty stores
  - Street food between attractions
  - Small cultural detours (shrine, market, hidden garden)
  - Search: `"{area} hidden gems"`, `"{station} recommended cafe"`, `"{walking route} along the way"`, `"{area} walking recommendations" site:instagram.com`
  - Format: "**Along the way:** Asakusa→Skytree, you'll pass Sumida Park (riverside cherry blossoms) and Suzukien matcha daifuku"
  - Mark optional, include Google Maps link

---

## Step 3c: Transit Pass Cost Analysis

> | Date | Total Cost | Suggested Pass | Pass Price | Savings |
> |------|-----------|----------------|------------|---------|
> | Day 1 | Y2,690 | Skyliner separate | — | — |
> | Day 2 | Y1,100 | Subway day pass | Y600 | Y500 |
> | Day 3 | Y850 | Subway day pass | Y600 | Y250 |
> | Day 4 | Y3,200 | Kamakura day pass | Y1,520 | Y1,680 |
> | **Total** | **Y7,840** | | **Y5,240** | **Y2,600** |

---

## Step 3d: Work Day Planning (Digital Nomad Mode)

For every work day, you MUST recommend a specific workspace and validate hours.

1. **Convert work hours to local time** clearly:
   > Work TZ: UTC+8 (Taiwan) | Local: UTC+9 (Japan) | Local work hours: **10:00–18:00**

2. **For each work day**, 2–3 workspaces near hotel:
   > | Location | Hours | Covers? | Cost | Wifi | Notes |
   > |----------|-------|---------|------|------|-------|
   > | Engineer Cafe | 09:00–21:00 | Fully | Free | Yes | Government-run |
   > | Startup Cafe | 10:00–22:00 | Fully | Free | Yes | Tenjin |
   > | Co-Working Q | 08:00–22:00 | Fully | Y330/hr | 100Mbps+ | Inside Hakata Station |
   >
   > Avoid: XX Coffee — closes 17:00, **1hr before you finish**

3. **Validate every workspace**: hours must cover full local work hours. Closes early → exclude. Opens late → note gap. Search: `"{name}" operating hours` or Google Maps.

4. **Evening plan**: after work, nearby activities:
   > 18:00 Off → walk 10min → Nakasu Yatai food stalls (lively from 19:00)

---

## Step 3e: Get User Feedback

These are open-ended tweak questions, not multiple-choice — **ask in free text**, not via `AskUserQuestion` (which forces 2–4 fixed options per question). See [ask-user-question-rules.md](ask-user-question-rules.md).

- "Daily arrangement OK? Any tweaks?"
- "Make any day more relaxed? Move attractions across days?"
- "Adopt the transit pass recs?"

**Iterate until happy.** 2–3 rounds is fine.

---

## Step 3f: Itinerary Optimization by Location (MANDATORY)

Before confirming Phase 3, **analyze ALL POI coordinates to optimize geographic efficiency**.

**Algorithm:**
1. For each day, sum straight-line distances between consecutive events (lat/lng)
2. Identify zigzag patterns
3. Suggest swaps to group nearby attractions

**Output:**
```
Route Efficiency Analysis:

4/1 Busan — Nampo→Nampo→Nampo→Haeundae (south to north, smooth)
4/2 Busan — Fixed day tour, can't adjust
Suggestion: 4/7 Nishi Park night cherry + 4/10 Maizuru Park night cherry are close (both west) — move 4/10 Maizuru to 4/7

Pre-opt avg daily distance: 12.3 km
Post-opt avg daily distance: 8.7 km (save 29%)
```

**Rules:**
- Fixed/pre-booked CANNOT move
- Work days: only evening events movable
- Sunset/night events stay evening
- Present as **suggestions**, ask user to adopt

---

## Step 3g: Crowd-Aware Cross-Day Optimization (MANDATORY)

**Second optimization pass after geographic.** Uses Phase 4 `crowd` data (or preliminary cultural-knowledge estimates if Phase 4 not yet run; refine after).

**Algorithm:**
1. Mark each travel date weekday/weekend/holiday:
   - `"{country} public holidays {year}"`, `"{destination} public holidays {month}"`
2. For each attraction, check `crowd.peak_days` / `crowd.off_peak_days`
3. Apply swaps:
   - `peak_days: ["sat","sun"]` → move to weekdays
   - Weekends/holidays → assign nature spots, suburbs, hiking (crowd-dispersed)
   - Indoor (museums, aquariums) → rainy days AND holiday overflow
4. Local festival during dates → present TWO options:
   - **Avoid**: swap that area to a different day
   - **Embrace**: keep but warn + arrive early

**Cultural knowledge fallback:**
- Japan: temples/shrines busy weekends + New Year + Obon; museums closed Mon → Tue busier
- Korea: many museums closed Mon; parks/palaces busy weekends; cherry spots peak Sat–Sun
- Thailand: temples busy Buddhist holidays; malls busy Fri–Sun evenings
- Europe: museums busy Sat–Sun + first-Sun-free; restaurants busy Fri–Sat evenings
- General: school holidays = family attraction peaks; rainy days = indoor surges

**Rules:**
- Fixed/pre-booked CANNOT move
- Work days: evening only
- Sunset/night events stay evening
- Present as **suggestions**
- Runs AFTER geographic; if conflict, note trade-off ("Moving X to Thu saves crowds but adds 15min — worth it?")

---

## Step 3h: Cover Photo & Trip Tagline

Ask:
> "Which attraction are you most looking forward to? Send a photo and I'll put it on the cover."
> "Got a one-liner for this trip? (Or want me to write one?)"

- Photo provided → store as base64 in localStorage via upload button on Today overlay
- Tagline provided → store as `tagline` in trip.json (4-language translations)
- "You write one" → poetic one-liner capturing the trip's essence, translate to all 4 languages

The tagline appears on the Today overlay below the destination name.

```json
"tagline": {
  "zh": "從海邊城市走進火山秘境，櫻花盛開",
  "en": "From coastal city to volcanic wonders, under cherry blossoms",
  "ko": "해변 도시에서 화산 비경으로",
  "ja": "海辺の街から火山の秘境へ"
}
```

---

## Step 3i: Entry Requirements Research (MANDATORY)

For every destination country, research and compile ALL entry requirements.

**Research per country:**
1. Visa requirements for user's passport
2. Electronic entry forms (e-Arrival Card, Visit Japan Web, ESTA, ETA)
3. Application URLs — **official government website**, not third-party
4. Deadlines (e.g., "72 hours before arrival")
5. Required documents (passport validity, IDs, hotel address, flight number)
6. Health declarations
7. Customs declarations

**Store as `entryRequirements` in trip.json** (see [trip-json-schema.md](../../trip-html-generator/references/trip-json-schema.md)).

**Display on Today overlay:**
- Pending items appear ABOVE the todo list
- **Only items requiring an online form** — NOT general reminders
- Each clickable → official URL
- Deadline shown below
- NO red/warning borders — same glassmorphism style as other todo items

**Include (must-fill forms only):**
- Electronic entry cards (e-Arrival, ESTA, ETA)
- Online declarations (Visit Japan Web, Q-CODE)
- Visa applications

**EXCLUDE (put in checklist tab):**
- Passport validity reminders
- Visa-free status
- General document checks

---

## Step 3j: Entry Form Pre-fill Data (MANDATORY)

For each form in 3i, compile ALL fields user needs from already-collected data (flights, hotels, dates). Store as `entryForms` in trip.json.

**Display in checklist tab as collapsible `<details>`:**
- Each form = collapsible card, form name as summary
- Inside: all fields in label/value table
- **Click-to-copy**: clicking any value copies (with feedback)
- Link icon opens official form URL in new tab
- Pre-fill ALL known data: airline, flight#, dates, addresses, zip, purpose, length of stay, departure info

This saves the user from tab-switching — open form URL, copy each field from checklist.

---

## Phase 3 Confirmation Gate

> **Phase 3 Confirmed:** Daily routes + transit + passes + route optimization + crowd optimization + entry procedures + form data all set.
> Next: deep research (ticket prices, restaurants, shopping, crowd data), then HTML after confirmation.
