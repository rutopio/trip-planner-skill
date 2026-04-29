# `index.html` Skeleton — Generic, Trip-Agnostic

The HTML shell is identical across every trip. It contains layout scaffolding, mount points, and `<script id="trip-data">` for `file://` fallback. **Zero trip-specific strings.**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title data-i18n="meta.title">Trip Plan</title>

  <!-- 1. Google Fonts: Noto Sans (TC/JP/KR) + Material Symbols -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400..700,0..1,-50..200&display=swap" />

  <!-- 2. Leaflet CSS + JS (CartoDB Voyager tiles set in app.js) -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" defer></script>

  <!-- 3. Tailwind CSS (CDN JIT runtime) — handles 90% of styling. -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Noto Sans TC"', '"Noto Sans JP"', '"Noto Sans KR"', '-apple-system', 'system-ui', 'sans-serif'],
          },
          colors: {
            accent: 'var(--accent)',
            ink: 'var(--text)',
            paper: 'var(--bg)',
          },
          borderRadius: { DEFAULT: 'var(--r)' },
        },
      },
    };
  </script>

  <!-- 4. Custom CSS — minimal. Theme tokens + Tailwind-can't-do exceptions only. -->
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <!-- Sidebar (desktop) -->
  <nav class="sidebar" aria-label="Primary">
    <button class="sb active" data-tab="attractions" aria-label="Overview">
      <span class="mi material-symbols-outlined">travel_explore</span>
    </button>
    <button class="sb" data-tab="calendar" aria-label="Calendar">
      <span class="mi material-symbols-outlined">calendar_month</span>
    </button>
    <button class="sb" data-tab="booking" aria-label="Booking">
      <span class="mi material-symbols-outlined">sell</span>
    </button>
    <button class="sb" data-tab="budget" aria-label="Budget">
      <span class="mi material-symbols-outlined">wallet</span>
    </button>
    <button class="sb" data-tab="time" aria-label="Spots">
      <span class="mi material-symbols-outlined">map</span>
    </button>
    <button class="sb" data-tab="checklist" aria-label="Checklist">
      <span class="mi material-symbols-outlined">checklist</span>
    </button>
    <button class="sb" data-tab="retro" aria-label="Retro" hidden>
      <span class="mi material-symbols-outlined">auto_stories</span>
    </button>
    <div class="sb-spacer"></div>
    <div id="lang-switcher" class="lang-switcher"></div>
  </nav>

  <!-- Bottom bar (mobile) -->
  <nav class="bottom-bar" aria-label="Mobile primary">
    <div class="bottom-bar-inner">
      <button class="bb active" data-tab="attractions"><span class="mi material-symbols-outlined">travel_explore</span></button>
      <button class="bb" data-tab="calendar"><span class="mi material-symbols-outlined">calendar_month</span></button>
      <button class="bb" data-tab="booking"><span class="mi material-symbols-outlined">sell</span></button>
      <button class="bb" data-tab="time"><span class="mi material-symbols-outlined">map</span></button>
      <button class="bb" id="bb-more"><span class="mi material-symbols-outlined">more_horiz</span></button>
    </div>
    <div class="bb-more-menu" hidden>
      <button data-tab="budget"><span class="mi material-symbols-outlined">wallet</span><span data-tab-label="budget"></span></button>
      <button data-tab="checklist"><span class="mi material-symbols-outlined">checklist</span><span data-tab-label="checklist"></span></button>
    </div>
  </nav>

  <main class="main">
    <!-- Tab 1: Overview -->
    <section class="tab-panel active" id="tab-attractions">
      <header class="hdr">
        <div class="hdr-left">
          <h1 id="trip-destination"></h1>
          <p class="hdr-meta" id="trip-meta"></p>
          <p class="hdr-tagline" id="trip-tagline"></p>
        </div>
        <div class="hdr-right">
          <button class="btn-export" data-i18n="action.export"></button>
        </div>
      </header>

      <div class="stats" id="stats-bar"></div>
      <div class="info-box" id="info-box"></div>
      <div class="time-countdown-wrap" id="time-countdown"></div>
      <div class="today-card" id="today-card"></div>
      <div class="weather-forecast-strip">
        <div class="weather-strip-scroll" id="weather-strip"></div>
      </div>
    </section>

    <!-- Tab 2: Calendar -->
    <section class="tab-panel" id="tab-calendar">
      <header class="hdr"><h1 data-i18n="tab.calendar"></h1></header>
      <div id="calendar-desktop" class="calendar-desktop"></div>
      <div id="calendar-mobile" class="calendar-mobile"></div>
    </section>

    <!-- Tab 3: Booking -->
    <section class="tab-panel" id="tab-booking">
      <header class="hdr"><h1 data-i18n="tab.booking"></h1></header>
      <div id="flight-intel"></div>
      <div id="booking-purchased"></div>
      <div id="booking-compare"></div>
      <div id="booking-recommended"></div>
      <aside id="holiday-calendar"></aside>
    </section>

    <!-- Tab 4: Budget -->
    <section class="tab-panel" id="tab-budget">
      <header class="hdr"><h1 data-i18n="tab.budget"></h1></header>
      <div class="budget-mode-toggle" id="budget-mode-toggle"></div>
      <div id="budget-total"></div>
      <div id="budget-by-city"></div>
      <div id="budget-by-cat"></div>
      <div id="budget-detail"></div>
    </section>

    <!-- Tab 5: Spots / Map -->
    <section class="tab-panel" id="tab-time">
      <div class="filters" id="poi-filters"></div>
      <div class="attr-layout">
        <div id="map"></div>
        <div class="poi-list" id="poi-list"></div>
      </div>
    </section>

    <!-- Tab 6: Checklist -->
    <section class="tab-panel" id="tab-checklist">
      <header class="hdr"><h1 data-i18n="tab.checklist"></h1></header>
      <div id="entry-forms"></div>
      <div id="checklist-groups"></div>
      <div id="nomad-workspaces"></div>
    </section>

    <!-- Tab 7: Retro -->
    <section class="tab-panel" id="tab-retro">
      <header class="hdr"><h1 data-i18n="tab.retro"></h1></header>
      <div id="retro-map"></div>
      <div id="retro-budget-review"></div>
      <div id="retro-missed"></div>
      <div id="retro-changelog"></div>
      <div id="retro-lessons"></div>
    </section>
  </main>

  <!-- Inline trip data: file:// fallback. The CONTENT is identical to data/trip.json. -->
  <script id="trip-data" type="application/json">__TRIP_JSON__</script>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

## Rules for the generator

1. The shell above is **the entire `index.html`**. The only place trip data appears is inside `<script id="trip-data">` — and that is a verbatim copy of `data/trip.json`, not a hand-edited version.
2. Replace `__TRIP_JSON__` with the JSON-stringified `trip.json` content (after producing `data/trip.json`). Both files carry the same payload.
3. Every text node visible to the user has either `data-i18n="key"` (resolved by `app.js → t(key)`) or is empty (filled by a renderer reading `TRIP.*`).
4. Every tab button uses `data-tab="<id>"`. The `app.js` skeleton wires them up generically.
5. Material Symbols icon names that describe **UI chrome** (nav icons themselves) may stay literal. Trip-data icons (weather, city, POI category) come from JSON.
