# `index.html` Skeleton — Generic, Trip-Agnostic

The HTML shell is identical across every trip. Pure layout scaffolding + mount points + CDN tags. **Zero trip-specific strings, zero inline trip data.** Trip data is fetched at runtime from `data/*.json` shards by `app.js → loadTrip()`.

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

  <!-- 4. Inline <style> — design tokens + Tailwind-can't-do exceptions. NO external style.css. -->
  <style>
    /* === Design tokens (overridden by UI-style pack) === */
    :root {
      --bg: #FAFAFA;
      --text: #0A0A0A;
      --muted: #71717A;
      --border: #E4E4E7;
      --accent: #DC2626;             /* Swiss red — overridden by UI-style pack */
      --r: 0px;                      /* Swiss = zero radius */
      --pad: 24px;
      --col-gap: 16px;
      --font: 'Noto Sans TC', 'Noto Sans JP', 'Noto Sans KR', system-ui, sans-serif;
      --city-color: #6B7280;         /* Set per-element by injectCityVars() */
    }
    body { font-family: var(--font); background: var(--bg); color: var(--text); }

    /* === Calendar absolute-positioning math (Tailwind can't do calc(60px*N)) === */
    .cal-day-col { position: relative; }
    .cal-event { position: absolute; left: 0; right: 0; }
    /* Now-line indicator */
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

    /* === Cover/Today overlay slide animations === */
    .cover, .today-overlay { transition: transform .6s ease; }
    .cover-hidden { transform: translateY(-100vh); }
    .today-overlay.hidden { transform: translateY(-100%); }

    /* === Leaflet overrides (Tailwind can't reach Leaflet's DOM) === */
    .leaflet-popup-content-wrapper { border-radius: var(--r); }
    .leaflet-popup-content { font-family: var(--font); margin: 12px 16px; }
    .leaflet-container { font-family: var(--font); }

    /* === Print mode === */
    @media print {
      .sidebar, .bottom-bar, #lang-switcher, .cover, .today-overlay,
      #map, .cover-bottom, button { display: none !important; }
      body { background: white; }
      .tab-panel { display: block !important; page-break-after: always; }
    }

    /* === Pure-CSS bar charts (.h-bar-row width comes from inline --pct) === */
    .h-bar { background: var(--text); height: 100%; transition: width .3s; }
    .h-bar-row { height: 24px; background: var(--border); position: relative; overflow: hidden; }
  </style>
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

  <script src="app.js"></script>
</body>
</html>
```

## Rules for the generator

1. The shell above is **the entire `index.html`** — pure layout scaffolding with mount points. No trip data is inlined.
2. Trip data lives entirely in `data/*.json` shards. `app.js → loadTrip()` fetches them in parallel at boot. Run `python3 serve.py` to serve over HTTP — `file://` is no longer supported (sharded loading needs `fetch`).
3. Every text node visible to the user has either `data-i18n="key"` (resolved by `app.js → t(key)`) or is empty (filled by a renderer reading `TRIP.*`).
4. Every tab button uses `data-tab="<id>"`. The `app.js` skeleton wires them up generically.
5. Material Symbols icon names that describe **UI chrome** (nav icons themselves) may stay literal. Trip-data icons (weather, city, POI category) come from JSON.
