# Phase 2 — Recommend Attractions (Interactive Selection)

The most important conversational phase. Don't dump a list — curate, group by area, explain why each is worth visiting, let the user pick.

**Multiple rounds of `AskUserQuestion`.** Never present everything in one giant message — break into digestible batches, one area at a time.

---

## Step 2a: Deep Research from Multiple Sources

Use `WebSearch` AND `WebFetch` aggressively. **Search in the destination's local language FIRST** (Japanese for Japan, Korean for Korea, Thai for Thailand, etc.) — that's how you reach official sites and current prices. Cross-check with English second, user's language third. See [search-language-rules.md](search-language-rules.md). **At least 8–10 searches** to build a comprehensive picture.

### Source 1: Travel Platforms
Hit ALL five — different inventory and pricing:
- `site:klook.com {destination}` — top experiences, prices, ratings, "Top 10 / Must-visit / Popular"
- `site:kkday.com {destination}` — unique local experiences (cooking classes, private tours, workshops). Also `"{destination} day tour"`
- `site:trip.com {destination} things to do` — strong Asia coverage, Chinese-speaker deals
- `site:getyourguide.com {destination}` — Western-oriented destinations
- `site:tripadvisor.com "{destination}" "things to do"` — crowd-sourced rankings

### Day Tours & City Passes (search EVERY platform)
Multi-attraction passes often beat individual tickets:
- `"{destination} city pass"` — Osaka Amazing Pass, Fukuoka City Pass, Visit Seoul Card, etc.
- `"{destination} one-day tour"`, `"{destination} day trip itinerary"`
- KKday/Klook/Trip.com: `pass`, `transportation pass`, `attraction bundle`
- Fetch actual pass pages — extract: name, price, included attractions, validity, purchase link, transit included?

If a pass covers most must-go attractions, recommend proactively:
> "The Osaka Amazing Pass (Y2,800/day) covers 8 of your 12 selected attractions including Osaka Castle, Sumiyoshi Taisha, and unlimited subway rides. Adding to booking tab."

### Source 2: Official Tourism Sites
- Japan: `japan-guide.com`, `travel.jnto.go.jp`
- Korea: `visitkorea.or.kr`, `english.visitseoul.net`
- Thailand: `tourismthailand.org`
- Europe: each country/city has an official board
- Search: `"{destination} official tourism website"`

### Source 3: Local-Language Blogs & Forums
- Japan: `{destination} おすすめ スポット`
- Korea: `{destination} 여행 추천`
- Chinese-speaking users anywhere: `{destination} independent travel guide 2026`
- Thailand: `site:pantip.com {destination}`

### Source 4: Interest-Specific
- Food: `"{destination} best food streets"`, `"{destination} must-eat 2026"`
- Shopping: `"{destination} shopping guide"`, `"{destination} outlet mall"`
- Nature: `"{destination} nature day trips"`, `"{destination} hiking"`
- Nightlife: `"{destination} nightlife bars"`, `"{destination} night market"`
- Photography: `"{destination} instagram spots"`, `"{destination} check-in photo spots"`

### Source 5: Seasonal & Events
- `"{destination} events {month} {year}"`
- Cherry blossom / autumn leaves / Christmas market timing
- Major concerts, sporting events, exhibitions during dates

### Source 6: Social Media (for user confidence)
When user asks "Do you have more info?" or seems uncertain:
- `"{attraction}" site:instagram.com`, `"{attraction}" instagram reel`
- `"{attraction}" site:youtube.com`, `"{attraction}" vlog`
- `"{attraction}" Xiaohongshu` for Chinese-speaking users
- Include in recommendation: "[Photos/videos on IG](URL)"

### Source 7: Day Trips
- `"{destination} day trip destinations within 2 hours"`
- `"{destination} nearby day trip"`

---

## Step 2b: Present Attraction Recommendations (Multiple Rounds)

Present using **multiple separate `AskUserQuestion` calls**, one per area/category. `multiSelect: true`, **3–4 options max** per call (not more — decision fatigue, and 4 is the schema hard limit). `header` ≤ 12 chars. See [ask-user-question-rules.md](ask-user-question-rules.md).

### Round 1–N: Major Areas (one AskUserQuestion per area)

For each area, header message explaining the area, then options:

> **Area 1: Asakusa & Ueno**
> Tokyo's classic starting point. Temples, shopping streets, food, and museums concentrated here.
> The following are within 10–15 min walking distance, suitable for the same day:

```
question: "Asakusa & Ueno Area — which ones do you want to visit?"
options:
  - label: "Senso-ji Temple"
    description: "Tokyo's oldest temple + Kaminarimon Gate + Nakamise Shopping Street. Free, ~1.5hr."
  - label: "Tokyo Skytree"
    description: "634m deck, 15min walk from Asakusa. From Y2,100. Recommended at dusk."
  - label: "Ueno Park + Museum Complex"
    description: "Tokyo National Museum, National Museum of Western Art, Ueno no Mori. Park walk free."
```

### Round N+1: Experiences & Activities (KKday/Klook)
- Cooking classes, workshops, cultural experiences, unique tours
- Include price, duration, rating, platform name (e.g., "Klook 4.8, NT$1,200")

### Round N+2: Seasonal / Limited-Time
- Festivals, exhibitions during user's dates
- Flag urgency: "Ends 4/15, your dates just make it!"

### Round N+3: Day Trips
- Transit time + cost from base city
- Trade-offs: "Worth a day in Kamakura vs another Tokyo area?"

### Round N+4: Food Highlights
- Food streets, night markets, famous restaurants worth a detour
- "Not attractions but worth a special trip" — flag priority meals
- **Party-size matching (MANDATORY)**: tag every restaurant by user's `companions`:
  - `[Solo OK]` — counter, set meals, single portions
  - `[Couples]` — table seating, intimate
  - `[Family]` — spacious, kid-friendly
  - `[Groups OK]` — large tables, private rooms, reservation-friendly
  - `[Not ideal for {party}: {reason}]` — show but explain ("Solo: Korean BBQ, min 2-person portions")
- **Crowd timing**: peak wait + off-peak suggestion ("30min waits at noon — go 11:30 or 13:30")

---

## Step 2c: Confirm & Prioritize (TWO-STEP)

**Don't combine these.**

### Step 1: Confirm selections
After ALL area rounds, summarize:
> **Your Attraction List:**
> - Asakusa & Ueno: Senso-ji, Tokyo Skytree (2)
> - Shinjuku & Harajuku: Meiji Shrine, Takeshita Street, Shinjuku Gyoen (3)
> - Day trip: Kamakura (1 day)
> - Experience: Sushi making class
> - **Total X attractions, ~Y days needed**

Ask: "Anything to add?" and "Anything to remove?"

### Step 2: Priority — must-go vs if-time-permits

Mark must-go attractions. Unchecked → if time permits.

- **If ≤ 4 confirmed attractions:** one `AskUserQuestion`, `multiSelect: true`.
- **If 5–16 confirmed attractions:** paginate into rounds of ≤ 4 (group by area for coherence). Tell the user "must-go selection — page 1 of N" before each call.
- **If > 16 attractions:** render the full list as a numbered markdown checklist and ask the user to reply with the numbers of the must-gos in free text. `AskUserQuestion` is the wrong tool at that scale.

See [ask-user-question-rules.md](ask-user-question-rules.md) for the schema limits.

```
question: "Which of these are must-go? (Unchecked become 'if time permits' alternatives)"
options: [up to 4 confirmed attractions]
multiSelect: true
```

Result: clean two-tier list:
- **Must-go** — Phase 3 places these FIRST
- **If time permits** — Phase 3 fills gaps with these as transit-convenient add-ons

The HTML reflects priority (star icon on must-go, muted style on optional).

### Step 3: Time Conflict Check
Before finalizing, scan for time-of-day conflicts and FLAG:
- Multiple "sunset" spots on limited evenings
- Multiple "morning only" spots
- Same opening hours that can't both fit

Ask user to resolve: "Both are sunset spots — split into two days or pick one?"

If too many: "Selected {N} but only {days} days. Narrow to {suggested}?"
If too few: "Still {gap} empty days — recommend more?"

---

## Phase 2 Confirmation Gate

> **Phase 2 Confirmed:** Selected {N} attractions across {areas} areas.
> Confirm to start daily route planning.
