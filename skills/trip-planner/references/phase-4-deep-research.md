# Phase 4 — Deep Research

Gather **real, current** data for everything the user selected. The HTML must contain accurate, actionable info, not generic advice.

**Search in the destination's local language first** for hours, prices, and official-site verification — English-only queries miss the most accurate sources. See [search-language-rules.md](search-language-rules.md).

---

## Research Checklist

### 0. Flight Price Intelligence
(If not yet booked, or to validate the user's purchase)
- Historical: `"{origin} to {destination} flight price {month} history"`, `"Google Flights {route} price calendar"`, `"Skyscanner {route} cheapest month"`
- Current deals: `"{route} flight tickets deal"`, `"{airline} {route} promotion"`
- Collect 12 months of price points: `[{month: "Jan", low: 5000, high: 12000, avg: 7500}, ...]`
- Determine: current vs 12-month average, peak/off-peak months, predicted trend
- If already booked: compare user's price against 12-month range — good deal?
- Populates "Flight Price Intelligence" in Booking tab
- Also research **holiday calendar** (declared home country): next 6–12 months of public holidays + "Take X PTO for Y days off" tips

### 1. Visa Requirements
For user's passport.

### 2. Currency & Exchange
- Current rate (home → destination)
- **Mental math trick** — simple formula. KRW→TWD: "÷40" or "×0.025". JPY→TWD: "÷5" or "×0.2". Make it catchy.
- Best places to exchange (airport / ATM / downtown)
- Card payment prevalence (% of shops accept cards, contactless)
- Include in HTML quick-reference section

### 3. Country-Specific Practical Info (per country)
- **Driving side**: left/right (pedestrian awareness)
- **Credit cards**: Visa/Mastercard prevalence, contactless, local apps (PayPay, KakaoPay)
- **Price comparison with home**: convenience store meal, coffee, transit fare
- **Transit etiquette**: eat/drink? phone calls? priority seats?
- **Tipping**: expected? amount?
- **Tap water**: drinkable?
- All goes into checklist tab "Country Quick Facts"

### 4. Power Adapters
Plug type, voltage. **Recommend bringing a power strip** — most rooms only have 1–2 outlets near bed.

### 4b. Must-Download Apps
Transit, payment, maps, translation, ride-hailing.

### 5. Selected Attractions — Detailed Info
For EACH selected:
- Exact address, hours, closed days
- Admission (adult/child/student)
- Time to spend
- Tips (best visit time, avoid crowds, photo spots)
- **Crowd intelligence** (item 15)

### 6. Neighborhood Guide
For each attraction area: walkable food streets, shopping, hidden gems, photo spots.

### 7. Accommodation Areas (only if hotel NOT booked)
Best neighborhoods for user's style with pros/cons + price ranges.

### 8. Transportation Details
- **Airport ↔ city/hotel**: ALL options (train, bus, taxi, shuttle):
  - Route, duration, cost, first/last departures
  - How to find the stop at airport (floor, exit)
  - Payment (cash? IC card? where to buy?)
  - Step-by-step for recommended option
  - **Tutorial link** in user's conversation language (e.g., "Incheon to Seoul transportation guide" for English speaker). Fallback to English. NEVER link a guide in destination's local language unless user speaks it.
  - BOTH directions (return may differ)
- City passes: calculate worth based on routes
- Inter-city transport if multi-city

### 9. Tickets & Passes — CRITICAL
The output HTML has an interactive booking comparison table where user picks a platform and the price syncs to budget. Real data needed:
- Which attractions need advance booking? How far ahead?
- **City/regional passes**: search multi-attraction passes (JR Pass, Paris Museum Pass, Visit Busan Pass, Osaka Amazing Pass). Show math: "Pass costs X, individual tickets total Y, save Z"
- **Platform comparison** for EVERY paid attraction:
  1. Official website (real URL)
  2. Klook (`site:klook.com {name}` — real product URL)
  3. KKday (`site:kkday.com {name}` — real product URL)
  4. GetYourGuide if relevant
- Mark cheapest with star
- Note combos, early-bird, seasonal promos
- HTML booking table needs **radio buttons per platform** — selected price auto-updates budget tab. If a city pass is selected, zero out individual tickets the pass covers.
- All links REAL, verified URLs to actual product pages — not homepages

### 10. Food & Drink
For each route area: must-try dishes, recommended restaurants, food markets, price ranges. Specific: "Day 2 lunch (Shinjuku):..."
**Party-size suitability per restaurant** (item 16). Cross-reference Phase 1 `companions`, tag each.

### 11. Shopping Recommendations
Per area, what's worth buying nearby? Local specialties, souvenirs, drugstore must-buys, outlets/markets, specific products + prices. NOT generic — research what's actually popular at each location (e.g., "Myeongdong: Olive Young for K-skincare, Line Friends Store for gifts, ABC Mart sneakers").

### 12. Digital Nomad Spots (if nomad mode)
Cafes with wifi+power, coworking spaces, with addresses + speed if available.
**CRITICAL: Cross-check operating hours vs work hours.** Convert work TZ to local; ensure workspace is OPEN. Example: works 09:00–17:00 UTC+8 in Tokyo (UTC+9) = 10:00–18:00 local. Cafe closing 17:00 local won't work. Per workspace:
- Name, address, Google Maps link
- Operating hours (local)
- User's work hours in local — fits?
- 24h or late-night options if work is evening/night local
- Wifi speed, power outlets, seating comfort

### 13. Weather
For travel dates — pack suggestions.

### 14. Safety Tips
Scams, areas to avoid, emergency numbers.

### 15. Crowd Intelligence (MANDATORY) — every attraction AND restaurant

**Searches per POI:**
- `"{name}" popular times` — Google Maps Popular Times often surfaces
- `"{name}" best time to visit avoid crowds`
- `"{name}" crowded / busy times` (destination language)
- `"{name}" wait time queue`
- Restaurants: `"{name}" wait time queue line`, `"{name}" reservation`

**Store on POI as `crowd`:**
```json
{
  "crowd": {
    "peak_hours": ["10:00-14:00"],
    "off_peak_hours": ["07:00-09:00", "16:00-18:00"],
    "best_visit_window": "08:00-09:30",
    "peak_days": ["sat", "sun", "holidays"],
    "off_peak_days": ["tue", "wed", "thu"],
    "crowd_level": "high",
    "wait_time_peak": "15-20 min queues for photos",
    "wait_time_offpeak": "Almost no queues",
    "tips": ["Tue-Thu least crowded", "Afternoon backlit — go morning for photos"],
    "seasonal_note": "Cherry blossom (Mar-Apr) 2-3x normal crowds",
    "source": "Google Maps Popular Times + travel blogs"
  }
}
```

**`crowd_level`:**
- `high`: famous landmarks, iconic temples, peak-season, Instagrammable
- `medium`: popular but manageable, local favorites, shopping streets
- `low`: hidden gems, off-beaten-path, nature, neighborhood spots

**Fallback rules (no specific data):**
- Temples/shrines: weekends + morning peak; before 08:00 off-peak
- Markets/food streets: weekends + midday peak; weekday morning off-peak
- Museums: closed-day+1 = compensatory peak; weekday afternoon off-peak
- Nature/outdoor: weather-dependent; weekends peak; weekday off-peak
- Shopping streets: Fri eve + weekends peak; weekday morning off-peak
- Restaurants: lunch 12:00–13:00 peak, dinner 18:00–19:30 peak; off-peak ±1hr

**After collecting, refine Phase 3 itinerary:**
- Update Step 3g crowd optimization with real data
- Flag conflicts: "Data shows X HIGH on Sat but currently scheduled Sat — swap to Thu (LOW)"

### 16. Restaurant Party-Size Suitability (MANDATORY) — every restaurant

**Searches:**
- `"{name}" seating counter table seats`
- `"{name}" solo dining` / `"{name}" group dining`
- `"{name}" solo OK` (JP/KR)
- Google Maps reviews for seating capacity, wait times, party sizes

**Store on POI as `dining`:**
```json
{
  "dining": {
    "party_size": {"min": 1, "max": 2, "ideal": "solo-friendly"},
    "seating": "counter 8 + 3 tables (4-seat)",
    "solo_friendly": true,
    "group_friendly": false,
    "group_min_seats": 4,
    "min_order_note": null,
    "wait_time_peak": "weekday 10min, weekend 30-40min",
    "wait_time_offpeak": "no wait",
    "tips_solo": ["Counter seating, perfect for solo"],
    "tips_group": ["Only 3 tables — groups of 4+ wait 30min+, consider splitting"],
    "warnings": []
  }
}
```

**Matching by `companions`:**
- **Solo**: prioritize counter, set meals (teishoku), single portions. AVOID sharing-oriented (Korean BBQ min 2-person, hot pot, family-style large plates). If sharing place is recommended: "Best for 2+. Solo: try {alternative} nearby." Flag oversized portions.
- **Couple (2)**: most work. Flag counter-only (less romantic), recommend table alternatives.
- **Family with kids**: high chairs, kid-friendly menu, stroller space. AVOID tiny izakayas, standing-only bars, no-kids policies.
- **Group (4+)**: AVOID <15 seats. Prioritize private rooms, large tables, reservations. Small famous shop must-try: "Visit in shifts of 2, or go off-peak."

**Presentation in Phase 2/3 recs:**
- Tag: `[Solo OK]` `[Couples]` `[Family]` `[Groups OK]` `[Groups: reserve needed]`
- Mismatch: still show with warning: `[Solo: menu for 2+, sharing required]`, `[Group of 5: only 8 counter seats, 30min+ wait]`
- Don't silently exclude — let user decide, make trade-off clear

---

## Research Quality Rules

- Always include **prices** in destination + home currency
- Always include **addresses** or at minimum neighborhood
- Always include **opening hours** when available
- Prefer official sources + recent blogs (last 2 years)
- **Verify hours and prices on the official local-language page** — third-party English summaries lag and are often wrong. See [search-language-rules.md](search-language-rules.md).
- Outdated/uncertain → note in HTML with warning icon
- **Booking links must be real product URLs** — `site:klook.com {name}`, `site:kkday.com {name}` for actual product pages, not homepages
- Every paid attraction: compare ≥3 sources (official + 2 platforms)

---

## Research Budget (MANDATORY — prevents Phase 4 from running forever)

Phase 4 is the most expensive phase (most web searches, most token spend). Without limits the LLM will keep refining and cross-checking until the user gets bored. Apply this budget:

### Per-POI ceiling

For each POI, do at most **3 web searches** total. Spend them in this priority order:

1. **One** combined search for `{name} {city} price hours address` (gets 70% of fields).
2. **One** search for `{name} klook OR kkday` (booking comparison).
3. **One** search for `{name} crowd peak hours` or `{name} reservation needed` (situational).

If after 3 searches a field is still unknown, write `"check on arrival"` (with warning icon in the UI) and **move on**. Don't burn a 4th search.

### Per-field stop rules

| Field | Stop when… |
|-------|-----------|
| Price | You have a number from any official OR Klook/KKday source. Don't keep cross-checking 5 platforms. |
| Hours | You have weekday + weekend. Holiday-specific hours = nice-to-have, not required. |
| Address | Neighborhood-level is enough; full street is ideal but not required. |
| Crowd | One mention of "peak X–Y, quieter at Z" is enough. Don't aggregate 4 blogs. |
| Booking platforms | Compare official + Klook + KKday = 3 platforms total. **Don't add Viator/GetYourGuide unless one of those three is missing.** |

### Per-trip total ceiling

- **Web searches across all of Phase 4: cap at ~`POI count × 3 + 25`.** A 20-POI trip = ~85 searches max.
- After 75% of budget is spent, **stop researching new POIs** and finalize what's already researched.

### What NOT to research (skip immediately)

- ❌ POIs the user said "skip" or "maybe" — only research `must-visit` and `recommended` selections.
- ❌ Items the user has already provided (in conversation). Re-checking is waste.
- ❌ Generic destination overviews ("things to do in Tokyo") — this is Phase 2 work, not Phase 4.
- ❌ Hotel research if `logistics.accommodation` is already booked.
- ❌ Flight research if `logistics.flights` is already booked.

### "Good enough" signal

When **80% of POIs have price + hours + address + 1 booking source**, declare Phase 4 complete and move to 4.5. The remaining 20% can carry `"check on arrival"` markers without breaking the trip.

This is a hard rule, not a guideline. **If you find yourself on the 4th search for a single POI, stop and tag the field as `check on arrival`.**

### Mandatory progress reporting + per-POI announcement

Phase 4 is invisible to the user — they see nothing while you research 18 POIs. **Two mandatory observability rules**:

**1. Per-POI announcement.** Before researching each POI, output one line and stick to it:

```
Researching p5 (Bondi Coastal Walk)...
  Search 1/3: "bondi coogee walk price hours" → got hours, free
  Search 2/3: "bondi coogee walk klook tour" → no booking platform sells this
  ✓ Sufficient (2 searches used). Moving to p6.
```

This forces you to count your own searches per POI. If you find yourself typing "Search 4/3" you've blown the budget — stop and mark `"check on arrival"`.

**2. Phase-end self-audit.** After all POIs done:

```
Phase 4 complete. Used 47 searches across 18 POIs (avg 2.6 per POI, under the 3-per-POI ceiling).
16/18 fully populated; 2 marked "check on arrival".
```

This audit is mandatory. Counting your own tool history forces you to notice if the budget is being blown — and gives the user a concrete data point before approving Phase 5.

## Tutorial & Guide Language Rules

For tutorial links, how-to guides, step-by-step (transit card, airport→city, payment app):
- Search for guides in **user's conversation language FIRST**
- No quality guide there → **English** fallback
- **Never link guides in destination's local language** unless user speaks it
- Purchase/application tutorials (eSIM, transit card, visa, city pass): step-by-step with screenshots if possible
- Include in checklist tab and booking tab where relevant
- Always recommend cheapest + explain ("Klook KRW 10,500 vs official KRW 12,000 — save 12%")
- City pass exists: calculate worth based on itinerary
