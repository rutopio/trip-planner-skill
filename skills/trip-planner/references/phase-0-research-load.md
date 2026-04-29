# Phase 0 + 0.5 — Load & Review Existing Research

## Phase 0: Auto-Load `travel-research.json` (No User Interaction)

Before any conversation, check if `travel-research.json` exists in the working directory. This file is produced by the `travel-collector` skill.

**If it exists:**
1. Read it silently at the start
2. Use it as the **primary data source** throughout all later phases:
   - **Phase 1 (Gather):** Pre-fill known info (transport, accommodations, budget references)
   - **Phase 2 (Recommend):** Start with the user's pre-collected POIs instead of searching from scratch. Present them first ("You've collected these places before, let me organize them..."), then supplement with web research for gaps (e.g., 15 attractions but no food spots)
   - **Phase 3 (Routes):** Use location/area data from research items to cluster POIs by neighborhood
   - **Phase 4 (Deep Research):** Skip re-searching places that already have complete data (price, hours, address, booking URL). Focus on gaps and updates
3. Respect the `priority` field: `must-visit` items go into the itinerary by default
4. Preserve `source` info — when presenting a POI, mention where it came from ("collected from lillian.tw", "from the PDF guide")
5. Use `passes_and_deals` data to inform the booking comparison table
6. Use `general_tips` to pre-populate the checklist tab

**If it does NOT exist:** proceed normally. Skip Phase 0.5 entirely. Do not mention it.

---

## Phase 0.5: Travel Research Review (Only When File Exists)

**Step 1 — Show a compact summary table:**
```
已載入 {N} 筆旅遊研究資料：

| # | 名稱               | 類型       | 城市   | 優先級        |
|---|--------------------|------------|--------|---------------|
| 1 | 青山1954           | food       | Busan  | recommended   |
| 2 | 廣安里擴香瓶店     | shopping   | Busan  | recommended   |
```
(List all items from `travel-research.json` items[])

**Step 2 — Ask:**
> "已有 **{N} 筆**旅遊資料。要在開始排行程前補充更多嗎？
> （可以貼入景點連結、截圖、文字推薦，或直接說「**開始排行程**」）"

**Step 3 — Loop until confirmed:**
- New input: process it (same logic as travel-collector skill), append to `travel-research.json`, re-display updated table with new count, ask again
- "開始排行程", "繼續", "沒有了", "ok": proceed to Phase 1

**Step 4 — Proceed to Phase 1** with all collected data.
