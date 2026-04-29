# Trip Planner Plugin

Interactive travel planning toolkit for Claude. Drop research material, plan an itinerary, and generate a single-file HTML travel guide. Open it in your browser yourself — no server, no deploy.

## Skills

| Skill | Description |
|-------|-------------|
| **travel-collector** | Parses dropped URLs, screenshots, blog posts, social links, or notes into a structured summary that lives in conversation context |
| **flight-intelligence** | Flight price research, seasonality analysis, buy-now-or-wait recommendations |
| **trip-planner** | Main orchestrator — conversational trip planning from gathering to HTML generation (Phases 1–5) |

## Workflow

```
(Optional) travel-collector  ── parse links / screenshots / notes
                                       │
                                       ▼
trip-planner
  Phase 1   gather logistics & preferences (seeded from collector summary if any)
  Phase 1.5 ─→ flight-intelligence (if not booked)
  Phase 2   recommend attractions
  Phase 3   day-by-day routes
  Phase 4   deep research (prices, hours, links)
  Phase 4.5 final confirmation gate
  Phase 5   write single-file index.html and stop
```

## Output

A single self-contained `index.html` per trip:

- All trip content written as plain HTML markup in the user's language
- Tailwind CSS via CDN, Inter via Google Fonts CDN — **only two external dependencies**
- ≤ 30 lines of JS total (tab switcher + optional currency toggle)
- Visual style fixed: modern shadcn / Vercel / Next.js aesthetic
- Monolingual: written in the user's conversation language, no i18n
- The agent stops after writing the file; the user opens `index.html` themselves

## Install

Upload the `.plugin` file in Claude Desktop, or add this repo as a marketplace:

```
owner/repo
```
