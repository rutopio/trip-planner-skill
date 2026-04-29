### HTML Content Sections

The generated HTML must include ALL of these content sections, distributed across the 5 tabs.

**The first tab IS the Overview tab** (id=tab-attractions, icon=travel_explore) containing trip header, stats, countdown, today card, and weather strip. **The Spots/Map tab** (id=tab-time, icon=map) has filters + full-height map + POI list. **The Retro tab** (id=tab-retro, icon=auto_stories) is hidden until after the trip ends. 7 tabs total: Overview, Calendar, Booking, Budget, Spots, Checklist, Retro (post-trip only).

**Attractions Tab:**
1. Trip header (destination, dates, duration, description) -- NO hero banner image
2. Stats bar (actual total spent, attraction count, actual daily average, work hours if nomad).
   Shows ACTUAL spending from `budget.actual_expenses`. If no actual data exists yet (pre-trip),
   display "--" for monetary values. Never show estimated/planned numbers in the stats bar.
3. Filter chips (by city, by category)
4. Interactive map (Leaflet/OpenStreetMap with colored circle markers + "Export to Google Maps" button)
5. POI list with checkboxes (name, address, city, price)
   **Every POI MUST have a Google Maps link** -- opens in new tab, links to the actual
   location on Google Maps. Format: `<a href="https://www.google.com/maps/search/?api=1&query={encoded_place_name}+{city}" target="_blank">`
   **Already-booked items MUST have a link to the booking platform** (Klook order page,
   hotel booking page, airline page, etc.) so the user can quickly access their confirmation.
   NOTE: Booking comparison table is NO LONGER in this tab -- it's in the Booking tab.

**Calendar Tab:**
7. Week/day view calendar with all activities placed by time
8. Mobile list fallback
   **Every calendar event that is a location/attraction MUST also have a Google Maps link**
   next to the event name, same format as POI links

**Booking Tab (Ticket Price Comparison -- separate tab, NOT inside Attractions):**
8. **Flight Price Intelligence** (always present, at the very top of Booking tab):
   - **If flights are NOT booked:** show a full price analysis panel:
     - Historical price chart (past 12 months) as a CSS bar chart -- one bar per month,
       bar height = price level, current month highlighted. Use `--chart-bar` for past months,
       accent color for the user's target travel month
     - Key metrics: current lowest price, 12-month range (min-max), current vs average (up/down X%)
     - Buy/wait recommendation badge: "Buy now" / "Wait a bit" / "Expensive" with reasoning
     - Cheapest airline + link to booking page
     - "Set price alert" button -> links to Google Flights price tracking for the route
     - If dates were flexible: show the recommended window from Phase 1.5 analysis
     - If user can WFH: note "Can work remotely -- recommend going during off-season for longer, more cost-effective"
   - **If flights ARE already booked:** show a compact "Your price vs historical" summary:
     - One line: "NT$18,600 - Historical range NT$X-Y - Your price is at {percentile} ({good/average/expensive})"
     - Small spark-line or mini bar showing where their price falls in the 12-month range
   - **Holiday calendar sidebar** (compact, always shown):
     - Next 3-6 upcoming holidays from the user's holiday country
     - Each with: date, name, "Take X PTO days for Y days off" optimization tip
     - Flag which holidays overlap with the trip dates
     - Source: user's nationality / declared holiday country from Phase 1
9. **Already-purchased items** section -- shows all booked items with:
   - Item name, date, cost, link to booking platform/confirmation page
   - Status badge: Purchased (green) or To purchase (amber)
   - Categories: Flights, Accommodation, Transport, Tickets/Experiences
   - **Flights MUST show**: departure/arrival terminal numbers (e.g., Taoyuan T1, Gimhae T1),
     flight time, airline name. Split outbound/return into separate cards.
     Each terminal has a Google Maps link.
   - **Ferries/trains MUST show**: departure/arrival terminal or station name with map links
   - **Hotels MUST show**: hotel name with Google Maps link
   - **Tours MUST show**: meeting point address with Google Maps link
   - Every address/location in any booked card gets a Google Maps link button:
     `<a href="https://www.google.com/maps/search/?api=1&query={place}" target="_blank">`
   - If flights are booked, show a small inline verdict on the flight card:
     "Below average by X%" or "Near average" or "Above average by X%" based on historical price data
10. **Price comparison table** for paid attractions not yet purchased:
    - Radio buttons per platform (Official / Klook / KKday) per attraction
    - Selecting platform updates budget tab with that price
    - Star marks cheapest option
    - All links must be REAL verified URLs to the actual product page
    - City pass analysis: if a pass covers multiple attractions, show the math
11. **Recommended purchases** -- items the user hasn't bought yet but should:
    - eSIM card options with prices
    - Transit passes (T-money, Nishitetsu pass, etc.)
    - Advance-booking-required attractions

**Expenses Tab:**
9. Estimated/Actual mode toggle (pill buttons)
10. Total spend with currency converter (label changes per mode: "Estimated Total" / "Actual Total")
11. City cost ratio horizontal bars (both modes -- estimated uses budget items' city, actual uses purchased + daily expense city fields)
12. Category breakdown horizontal bars (colored per category)
13. Detail list: estimated mode = flat table (item + city + cost); actual mode = "Pre-purchased" group (budget items with `purchased:true`) + per-date groups with day totals
14. No checkboxes -- all items displayed as plain rows

**Time Allocation Tab (renamed from Charts -- time-focused ONLY, no spending data):**
13. Time allocation segmented bar (Attractions X days / Work X days / Transport X days / Shopping X days / Food every day)
14. Per-city time breakdown (horizontal bars: city name + days spent)
15. Daily time split (how hours are distributed across activity types per day)

**Checklist Tab:**
16. Pre-trip checklist groups. Default groups include:
    - **Documents & Visa**: Passport validity, visa requirements, Visit Japan Web / K-ETA, **travel insurance** (~NT$500-800 or equivalent), e-ticket backups, ferry/train ticket backups, Klook order screenshots
    - **Finance & Currency Exchange**: Card acceptance, cash amounts per country, fee-free credit cards, transit cards (T-money, ICOCA/Suica)
    - **Must-Install Apps**: Maps (Naver for Korea, Google Maps for Japan), ride-hailing (Kakao T), translation (Papago), transit
    - **Luggage & Gear**: Plug adapter type per country, power bank, charger, clothing tips
    - **Connectivity**: eSIM/SIM card setup, wifi backup
17. Digital nomad workspaces (if nomad mode): name, address, wifi, tags

**Retro Tab (Post-Trip Retrospective -- visible only after trip ends):**

This tab is the trip's retrospective journal. It appears ONLY after `TRIP.endDate` has passed.
It consists of four sections: animated city map, budget review, missed attractions, and changelog.

18. **Route Map (Leaflet/OpenStreetMap)**

    One interactive Leaflet map per city visited, switching via city selector pills
    (e.g. "Busan (3/30-4/3)", "Fukuoka (4/5-4/12)"). Each map shows:
    - OpenStreetMap tiles as the base layer (same Leaflet setup as the Spots tab map)
    - Circle markers for each POI, colored by category (same category colors as main app)
    - Marker popups with place name + day number + visit order
    - Dashed polylines connecting POIs in visit order within each day, color-coded per day
    - Map auto-fits bounds to show all POIs for the selected city
    - City selector pills above the map -- clicking swaps the map data. Default: first city

    **Data flow:**
    - Read `pois.json` (loaded as `TRIP.pois`) → extract POIs grouped by city
    - Each POI needs: `lat`, `lng`, `name`, `cat`, `day_number`, `visit_order`
    - Route lines connect POIs in visit order within each day
    - Use Leaflet `L.circleMarker()` for POIs and `L.polyline()` with `dashArray` for routes

    **City selector:** pill buttons above the video player -- one per city. Clicking swaps the
    video source. Default: first city visited.

    **Map visual style:**
    - Background: soft cream/parchment (#f5f0e8) with subtle paper texture
    - City outline: light gray watercolor wash
    - POI icons: hand-drawn style, colored by category (same category colors as main app)
    - Route line: dashed, dark gray (#444), animated with `strokeDashoffset`
    - Typography: rounded sans-serif or hand-lettered style (Google Fonts: "Caveat" or "Patrick Hand")
    - Country flag: top-left corner, small
    - Overall mood: warm, personal, journal-like -- NOT technical or corporate

19. **Budget Review Section**

    Compares estimated budget (from Phase 1-4 planning) against actual spending (from Expenses
    tab's actual mode data). Tells the user WHERE and WHY they went over or under budget.

    **Data source:** `budget.json` (loaded as `TRIP.budget`) → `items` (estimated) vs `actual_expenses` (actual)

    **Layout:**
    ```
    +---------------------------------------------+
    |  Budget Verdict: [UNDER BUDGET by NT$3,200]  |  <- green badge if under, amber if over
    |  Estimated: NT$45,000  ->  Actual: NT$41,800  |
    +---------------------------------------------+

    +-- What Went Well ----------------------+
    | Transport: saved NT$2,100 by buying     |
    |    Nishitetsu Pass (estimated Y8,000 -> |
    |    actual Y5,200 with pass)             |
    | Food: stayed within budget -- good mix  |
    |    of street food and sit-down meals    |
    +----------------------------------------+

    +-- Where You Overspent -----------------+
    | Shopping: +NT$4,500 over budget         |
    |    -> Olive Young haul (NT$3,200) was   |
    |      unplanned. Consider setting a      |
    |      firmer shopping cap next time.     |
    | Attractions: +NT$800 over budget        |
    |    -> Added an extra boat tour on Day 5 |
    |      that wasn't in the original plan.  |
    +----------------------------------------+
    ```

    **Analysis logic (generated by AI during trip planning, stored in `retro.json`):**
    - Compare each category's estimated vs actual total
    - Categories where actual < estimated -> "What Went Well" card (green left border)
    - Categories where actual > estimated by >10% -> "Where You Overspent" card (amber left border)
    - For each overspend, explain WHY (cross-reference changelog to find what was added/changed)
    - Include actionable advice: "Next time, budget NT$X for shopping" or "The city pass saved you
      money -- use this strategy again"

    **Per-city breakdown:** horizontal bars showing estimated (outline) vs actual (filled) per city

20. **Missed Attractions -- Next Trip Seeds**

    Shows POIs that were in the plan but didn't get visited (user unchecked them, or they were
    in the "if time allows" tier and time ran out), plus attractions that were researched
    but not selected in Phase 2.

    **Data source:**
    - `pois.json` (loaded as `TRIP.pois`) → entries where `visited: false` or `status: "skipped"`
    - Phase 2 recommendations that the user didn't select (stored in `retro.unselected_pois`)

    **Layout:**
    ```
    +-- Didn't Make It This Time --------------------+
    |                                                 |
    | Taejongdae -- skipped (rain on Day 3)           |
    |    "Outdoor cliff walk, best on sunny day.      |
    |     Save for spring/fall visit."                |
    |    [Save for next trip]                         |
    |                                                 |
    | Gamcheon Culture Village sunset -- ran           |
    |    out of time on Day 2                         |
    |    "Go on a weekday morning instead.            |
    |     Crowds are 3x lighter before 09:00."        |
    |    [Save for next trip]                         |
    |                                                 |
    +------------------------------------------------+

    +-- Next Trip Ideas ----------------------------+
    |                                                |
    | Based on what you loved this trip (nature,     |
    | food, photography), here are suggestions:      |
    |                                                |
    | If you return to Busan:                        |
    |   * Taejongdae (skipped) + Igidae coastal      |
    |     walk -- combine for a full nature day      |
    |   * Gijang market for fresh seafood            |
    |                                                |
    | If you visit nearby cities:                    |
    |   * Gyeongju (2hr from Busan) -- temples +     |
    |     tombs, perfect for your culture interest   |
    |   * Tongyeong -- coastal town, less touristy   |
    |                                                |
    +------------------------------------------------+
    ```

    **"Save for next trip" action:** clicking the heart stores the POI in `localStorage` under a
    `next-trip-seeds` key. These can be exported or loaded by the travel-collector skill
    for the next trip to the same destination.

21. **Changelog -- Plan vs Reality**

    A timeline showing every modification from the original itinerary to what actually happened.
    This helps the user understand their own planning patterns and improve for next time.

    **Data source:** `retro.json` (loaded as `TRIP.retro`) → `changelog[]` -- an array of change events:
    ```json
    {
      "retro": {
        "changelog": [
          {
            "date": "2026-04-02",
            "day": 3,
            "type": "swap",
            "description": { "zh": "Swapped Taejongdae (outdoor) with ARTE Museum (indoor)" },
            "reason": { "zh": "rain" },
            "impact": "positive",
            "lesson": { "zh": "Always have indoor backup for outdoor days" }
          },
          {
            "date": "2026-04-03",
            "day": 4,
            "type": "add",
            "description": "Added spontaneous boat tour at Songdo",
            "reason": "local recommendation",
            "impact": "neutral",
            "lesson": "Leave 2-3hr buffer per day for spontaneous discoveries"
          },
          {
            "date": "2026-04-05",
            "day": 6,
            "type": "skip",
            "description": "Skipped Gamcheon sunset -- too tired after shopping",
            "reason": "fatigue",
            "impact": "negative",
            "lesson": "Don't schedule 5+ spots on shopping days -- energy runs out"
          }
        ],
        "planning_lessons": [
          "Leave buffer time: your best moments were unplanned discoveries",
          "Weather flexibility: having indoor/outdoor alternatives saved 2 rainy days",
          "Shopping days need fewer attractions -- you consistently ran out of energy",
          "The crowd-avoidance early morning slots worked perfectly -- keep using them",
          "Budget an extra 20% for shopping -- you overspent every trip"
        ]
      }
    }
    ```

    **Layout:** vertical timeline with colored dots:
    - Green dot: positive change (worked out better)
    - Amber dot: neutral change (no better or worse)
    - Red dot: negative change (missed something / regret)

    Each timeline entry shows: Day badge + what changed + why + lesson learned

    **Planning Lessons section** at the bottom -- AI-generated summary of patterns:
    ```
    +-- Lessons for Next Trip -------------------+
    |                                            |
    | Based on this trip's changes:              |
    |                                            |
    | 1. Leave 2-3hr buffer per day for          |
    |    spontaneous finds -- your best moments  |
    |    were unplanned                          |
    |                                            |
    | 2. Weather backup plan saved you twice --  |
    |    always prep indoor alternatives         |
    |                                            |
    | 3. Shopping days = max 3 attractions.      |
    |    You skipped evening plans on all        |
    |    shopping days due to fatigue.           |
    |                                            |
    | 4. Crowd-avoidance early morning slots     |
    |    worked perfectly (Gamcheon 08:00 was    |
    |    empty). Keep this strategy.             |
    |                                            |
    | 5. Budget 20% more for shopping --         |
    |    you overspent this category by NT$4,500 |
    |                                            |
    +--------------------------------------------+
    ```

    **How changelog data is collected:**
    - During the trip, the user can modify the calendar (drag events, add/remove).
    - Each modification is logged with a timestamp and auto-categorized reason
    - The `retro.changelog` is auto-populated by comparing `schedule` (original plan)
      with `schedule_actual` (what really happened, updated via calendar drag-and-drop)
    - If no modifications are made, the changelog shows: "You stuck to the plan perfectly!"
    - `retro.planning_lessons` are generated by the AI based on patterns in the changelog
