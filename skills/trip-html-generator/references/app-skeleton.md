# `app.js` Skeleton — Generic, Trip-Agnostic

This is the canonical `app.js` shape every generated trip uses. **It contains zero trip-specific strings.** Everything user-visible comes from `trip.json` (`i18n`, `cities`, `pois`, `schedule`, `weather`, `budget`, `booking`, `checklist`, `retro`).

The Phase 5 generator (`trip-html-generator`) emits an `app.js` matching this skeleton. The renderer functions are listed by name; their bodies follow the patterns shown in [layout-blueprint.md](layout-blueprint.md) and [html-content-sections.md](html-content-sections.md), but always read from `TRIP` and use `t(key)` — never inline strings.

```js
// =============================================================
// app.js — generic trip planner shell. NO trip-specific strings.
// All copy, prices, cities, dates come from data/trip.json.
// =============================================================

let TRIP = null;
let LANG = null;

// ---------- Bootstrap ----------
async function bootstrap() {
  TRIP = await loadTrip();
  LANG = pickInitialLang(TRIP);
  document.documentElement.lang = LANG;
  document.title = i18n('meta.title') || TRIP.destination || '';

  injectCityVars(TRIP.cities);
  bindLanguageSwitcher();
  bindTabs();

  renderAll();
  startCountdown();
}

async function loadTrip() {
  // Prefer external file; fall back to inline <script id="trip-data"> for file:// usage.
  try {
    const res = await fetch('data/trip.json', { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (_) { /* fall through */ }
  const inline = document.getElementById('trip-data');
  if (!inline) throw new Error('trip data missing');
  return JSON.parse(inline.textContent);
}

function pickInitialLang(trip) {
  const stored = localStorage.getItem('trip-lang');
  if (stored && trip.supportedLangs.includes(stored)) return stored;
  return trip.lang;
}

// ---------- i18n ----------
function t(key) {
  const dict = (TRIP.i18n && TRIP.i18n[LANG]) || {};
  if (key in dict) return dict[key];
  // Fallback to default language, then to the key itself
  const fallback = (TRIP.i18n && TRIP.i18n[TRIP.lang]) || {};
  return (key in fallback) ? fallback[key] : key;
}
const i18n = t;

// L(value) — resolve a localized value to a plain string.
// The trip.json contract: every user-visible field is a nested i18n object.
// Single-lang mode (default): { zh: "..." }   — one key, the user's lang.
// Multi-lang mode (opt-in):   { zh: "...", en: "..." }   — multiple keys.
// Bare strings are tolerated (returned as-is) but discouraged.
//
//   L(poi.name)             -> "Senso-ji"
//   L(poi.desc)             -> "Tokyo's oldest temple"
//   L(trip.tagline)         -> "Early summer in Tokyo"
//   L(undefined) / L(null)  -> ""
//
// CRITICAL: never insert an i18n object directly into the DOM (template literals,
// .textContent, .innerHTML). Always wrap with L(). If you forget, the user sees
// "[object Object]". The validator catches the most common mistake patterns.
function L(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value !== 'object') return String(value);
  if (LANG in value && typeof value[LANG] === 'string') return value[LANG];
  if (TRIP.lang in value && typeof value[TRIP.lang] === 'string') return value[TRIP.lang];
  if ('en' in value && typeof value.en === 'string') return value.en;
  // Last resort: any string property (deterministic order)
  for (const k of Object.keys(value)) {
    if (typeof value[k] === 'string') return value[k];
  }
  return '';
}

function bindLanguageSwitcher() {
  const root = document.getElementById('lang-switcher');
  if (!root) return;
  // Single-language mode: hide the switcher entirely. Nothing to switch to.
  if (!TRIP.supportedLangs || TRIP.supportedLangs.length <= 1) {
    root.hidden = true;
    return;
  }
  root.hidden = false;
  root.innerHTML = TRIP.supportedLangs.map(code =>
    `<button class="lang-btn${code === LANG ? ' active' : ''}" data-lang="${code}">${code.toUpperCase()}</button>`
  ).join('');
  root.addEventListener('click', e => {
    const btn = e.target.closest('[data-lang]');
    if (!btn) return;
    LANG = btn.dataset.lang;
    localStorage.setItem('trip-lang', LANG);
    document.documentElement.lang = LANG;
    renderAll();
  });
}

// ---------- City registry ----------
function injectCityVars(cities) {
  // Provide a lookup helper for renderers; do NOT add per-city CSS rules.
  const map = new Map(cities.map(c => [c.id, c]));
  window.__cityById = id => map.get(id) || { id, name: { en: id }, color: 'var(--text-3)', icon: '' };
}
const cityById = id => window.__cityById(id);
const cityName = id => L(cityById(id).name);
const cityColor = id => cityById(id).color;

// ---------- Currency ----------
function fmtMoney(amount, currencyCode) {
  const cur = currencyCode || TRIP.currency.home;
  const n = Number(amount) || 0;
  return new Intl.NumberFormat(LANG, { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
}
function toHome(amount, fromCode) {
  if (!fromCode || fromCode === TRIP.currency.home) return amount;
  const rate = TRIP.currency.rates[fromCode];
  return rate ? amount / rate : amount;
}

// ---------- Tabs ----------
function bindTabs() {
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
  });
  // Hide retro tab pre-trip
  const retroBtn = document.querySelector('[data-tab="retro"]');
  if (retroBtn && new Date() < new Date(TRIP.endDate)) retroBtn.hidden = true;
}
function showTab(id) {
  const current = document.querySelector('.tab-panel.active');
  if (current && current.id === 'tab-' + id) return;
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('tab-' + id);
  if (panel) panel.classList.add('active');
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
  window.scrollTo(0, 0);
}

// ---------- Master render ----------
function renderAll() {
  renderHeader();
  renderStats();
  renderCountdown();
  renderTodayCard();
  renderWeatherStrip();
  renderSpotsTab();
  renderCalendar();
  renderBooking();
  renderBudget();
  renderChecklist();
  renderRetro();
  renderTabLabels();
}

function renderTabLabels() {
  document.querySelectorAll('[data-tab-label]').forEach(el => {
    el.textContent = t('tab.' + el.dataset.tabLabel);
  });
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const value = t(key);
    // If the key resolved to itself (missing translation), leave existing
    // placeholder text in place so the UI is never empty.
    if (value && value !== key) el.textContent = value;
  });
}

// ---------- DOM helpers ----------
function setText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }
function setHTML(id, html)  { const el = document.getElementById(id); if (el) el.innerHTML = html; }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
function fmtDate(iso, opts) {
  return new Intl.DateTimeFormat(LANG, opts || { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(iso + 'T00:00:00'));
}
function fmtH(h) {
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

// ---------- Per-section renderers (minimum-viable) ----------
// Bodies follow layout-blueprint.md / html-content-sections.md exactly. Every
// string passes through t(key) or L(field). Every city color is injected via
// --city-color CSS variable. Never insert a raw i18n object into the DOM.

function renderHeader() {
  setText('trip-destination', TRIP.destination);
  const days = Math.round((new Date(TRIP.endDate) - new Date(TRIP.startDate)) / 86400000) + 1;
  setText('trip-meta', `${fmtDate(TRIP.startDate)} → ${fmtDate(TRIP.endDate)} · ${days} ${t('label.days') || ''}`);
  setText('trip-tagline', L(TRIP.tagline));
}

function renderStats() {
  const actuals = (TRIP.budget && TRIP.budget.actual_expenses) || [];
  const purchased = ((TRIP.budget && TRIP.budget.items) || []).filter(b => b.purchased);
  const totalActual = actuals.reduce((s, x) => s + toHome(x.cost_local || x.cost_home, x.currency || TRIP.currency.home), 0)
                    + purchased.reduce((s, x) => s + (x.cost_home || 0), 0);
  const days = Math.max(1, Math.round((new Date(TRIP.endDate) - new Date(TRIP.startDate)) / 86400000) + 1);
  const cards = [
    { label: t('label.total'),    value: actuals.length ? fmtMoney(totalActual) : '–' },
    { label: t('label.poiCount'), value: (TRIP.pois || []).length },
    { label: t('label.dailyAvg'), value: actuals.length ? fmtMoney(totalActual / days) : '–' },
  ];
  setHTML('stats-bar', cards.map(c =>
    `<div class="st"><div class="st-label">${escapeHtml(c.label)}</div><div class="st-value">${escapeHtml(c.value)}</div></div>`
  ).join(''));
}

function renderCountdown() {
  // Body filled by startCountdown()'s tick function; this is a no-op so initial
  // render does not flash the wrong number.
  startCountdown();
}

function startCountdown() {
  const host = document.getElementById('time-countdown');
  if (!host) return;
  const tick = () => {
    const ms = new Date(TRIP.startDate + 'T00:00:00') - new Date();
    if (ms <= 0) { host.textContent = ''; return; }
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    host.textContent = `${d}d ${h}h ${m}m`;
  };
  tick();
  if (!window.__countdownTimer) window.__countdownTimer = setInterval(tick, 60000);
}

function renderTodayCard() {
  const host = document.getElementById('today-card');
  if (!host) return;
  const today = new Date().toISOString().slice(0, 10);
  const day = (TRIP.schedule || []).find(d => d.date === today);
  if (!day) { host.innerHTML = `<div class="empty">${escapeHtml(t('empty.no_events'))}</div>`; return; }
  const c = cityById(day.city);
  host.innerHTML = `
    <div class="today-card-inner" style="--city-color:${c.color}" data-city="${day.city}">
      <div class="today-card-header">${escapeHtml(cityName(day.city))} · ${escapeHtml(fmtDate(day.date))}</div>
      <div class="today-events-timeline">${day.events.map(ev => `
        <div class="today-ev">
          <span class="ev-time">${fmtH(ev.sh)}–${fmtH(ev.eh)}</span>
          <span class="ev-name">${escapeHtml(L(ev.name))}</span>
        </div>`).join('')}
      </div>
    </div>`;
}

function renderWeatherStrip() {
  const host = document.getElementById('weather-strip');
  if (!host || !TRIP.weather) return;
  host.innerHTML = TRIP.weather.map(w => {
    const c = cityById(w.city);
    return `
      <div class="weather-day" data-date="${w.date}">
        <span class="mi material-symbols-outlined">${escapeHtml(w.icon)}</span>
        <div class="wd-temp">${w.high}°/${w.low}°</div>
        <div class="wd-city-row" style="--city-color:${c.color}" data-city="${w.city}">
          <div class="wd-city-dot" title="${escapeHtml(cityName(w.city))}"></div>
          <span class="wd-city-label">${escapeHtml(cityName(w.city))}</span>
        </div>
      </div>`;
  }).join('');
}

function renderSpotsTab() {
  // Filters: one chip per city + one per category present in pois
  const cats = [...new Set((TRIP.pois || []).map(p => p.cat).filter(Boolean))];
  setHTML('poi-filters',
    (TRIP.cities || []).map(c =>
      `<button class="chip" data-filter-city="${c.id}" style="--city-color:${c.color}">${escapeHtml(L(c.name))}</button>`
    ).concat(cats.map(cat =>
      `<button class="chip" data-filter-cat="${cat}">${escapeHtml(t('cat.' + cat) || cat)}</button>`
    )).join('')
  );

  // POI list
  setHTML('poi-list', (TRIP.pois || []).map(p => {
    const c = cityById(p.city);
    const price = p.price_local != null
      ? fmtMoney(p.price_local, p.currency || TRIP.currency.home)
      : '';
    return `
      <div class="poi" data-poi-id="${escapeHtml(p.id)}" style="--city-color:${c.color}">
        <span class="poi-dot"></span>
        <div class="poi-info">
          <div class="poi-name">${escapeHtml(L(p.name))}</div>
          <div class="poi-meta">${escapeHtml(cityName(p.city))} · ${escapeHtml(p.hours || '')} · ${escapeHtml(price)}</div>
          <div class="poi-desc">${escapeHtml(L(p.desc))}</div>
        </div>
        <a class="poi-map-link" target="_blank" rel="noopener"
           href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(L(p.nameLocal) || L(p.name))}">
           <span class="mi material-symbols-outlined">map</span>
        </a>
      </div>`;
  }).join(''));

  // Map: bind ONLY to #map inside #tab-time. The validator enforces single occurrence.
  initSpotsMap();
}

let __spotsMap = null;
function initSpotsMap() {
  const el = document.getElementById('map');
  if (!el || typeof L === 'undefined') return; // L here would shadow our resolver — see note below
  if (__spotsMap) { __spotsMap.remove(); __spotsMap = null; }
  if (typeof window.L === 'undefined') return; // Leaflet not loaded
  const pois = (TRIP.pois || []).filter(p => p.lat && p.lng);
  if (!pois.length) return;
  __spotsMap = window.L.map('map').setView([pois[0].lat, pois[0].lng], 12);
  // CartoDB Voyager basemap. Do NOT use tile.openstreetmap.org directly —
  // OSM's tile server blocks high-volume / browser-CDN traffic and returns 403.
  // CartoDB allows anonymous use and has stable CORS.
  window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 20,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
  }).addTo(__spotsMap);
  pois.forEach(p => {
    window.L.circleMarker([p.lat, p.lng], { radius: 8, color: cityColor(p.city), fillOpacity: 0.8 })
      .bindPopup(`<strong>${escapeHtml(L(p.name))}</strong><br>${escapeHtml(L(p.desc))}`)
      .addTo(__spotsMap);
  });
  const bounds = window.L.latLngBounds(pois.map(p => [p.lat, p.lng]));
  __spotsMap.fitBounds(bounds.pad(0.1));
}
// NOTE: Leaflet exposes itself as the global `L`. Our localizer is also `L` — but
// it's a function defined at module scope; `window.L` always points to Leaflet,
// `L` (without window.) inside renderer bodies always points to our resolver.
// Always use `window.L` for Leaflet. Always use `L(obj)` (one arg) for localization.

function renderCalendar() {
  const host = document.getElementById('calendar-desktop');
  if (!host || !TRIP.schedule) return;
  const days = TRIP.schedule;
  // Header row
  let html = '<div class="cal-row cal-head"><div class="cal-time-col"></div>';
  days.forEach(d => { html += `<div class="cal-day-hdr">${escapeHtml(fmtDate(d.date, { weekday: 'short', day: 'numeric' }))}</div>`; });
  html += '</div>';
  // Hour grid
  html += '<div class="cal-grid"><div class="cal-time-col">';
  for (let h = 6; h <= 22; h++) html += `<div class="cal-time-slot">${h}:00</div>`;
  html += '</div>';
  days.forEach(d => {
    html += '<div class="cal-day-col">';
    for (let h = 6; h <= 22; h++) html += '<div class="cal-hour-slot"></div>';
    d.events.forEach(ev => {
      const top = (ev.sh - 6) * 60;
      const height = Math.max(20, (ev.eh - ev.sh) * 60 - 2);
      html += `<div class="cal-event cat-${escapeHtml(ev.cat || 'other')}" style="top:${top}px;height:${height}px">
        <div class="ev-title">${escapeHtml(L(ev.name))}</div>
        <div class="ev-loc">${fmtH(ev.sh)}–${fmtH(ev.eh)}</div>
      </div>`;
    });
    html += '</div>';
  });
  html += '</div>';
  host.innerHTML = html;
}

function renderBooking() {
  const b = TRIP.booking || {};
  const purchased = b.purchased || [];
  setHTML('booking-purchased', purchased.map(item => `
    <div class="booked-card">
      <h3>${escapeHtml(L(item.name))}</h3>
      ${item.depart ? `<div>${escapeHtml(L(item.depart.place))} ${escapeHtml(item.depart.time || '')} → ${escapeHtml(L(item.arrive.place))} ${escapeHtml(item.arrive.time || '')}</div>` : ''}
      ${item.cost_home != null ? `<div>${fmtMoney(item.cost_home)}</div>` : ''}
      ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">↗</a>` : ''}
    </div>`).join('') || `<div class="empty">${escapeHtml(t('empty.no_actuals'))}</div>`);

  // Compare table, recommended, holiday calendar — same pattern; omitted from
  // skeleton minimum but follow the same L()/t() rules.
}

function renderBudget() {
  const items = (TRIP.budget && TRIP.budget.items) || [];
  if (!items.length) return setHTML('budget-detail', `<div class="empty">${escapeHtml(t('empty.no_events'))}</div>`);
  const total = items.reduce((s, x) => s + (x.cost_home || 0), 0);
  setHTML('budget-total', `<div class="budget-total">${escapeHtml(t('label.estimated'))}: ${fmtMoney(total)}</div>`);
  const max = Math.max(1, ...items.map(x => x.cost_home || 0));
  setHTML('budget-detail', items.map(x => `
    <div class="budget-row">
      <div class="budget-name">${escapeHtml(L(x.name))}</div>
      <div class="budget-bar"><div style="width:${((x.cost_home || 0) / max) * 100}%"></div></div>
      <div class="budget-cost">${fmtMoney(x.cost_home || 0)}</div>
    </div>`).join(''));
}

function renderChecklist() {
  setHTML('checklist-groups', (TRIP.checklist || []).map(g => `
    <div class="cl-group">
      <h3>${escapeHtml(L(g.title))}</h3>
      ${(g.items || []).map(it => `
        <label class="cl-item">
          <input type="checkbox" ${it.done ? 'checked' : ''}>
          <span>${escapeHtml(L(it.label))}</span>
          ${it.url ? `<a href="${escapeHtml(it.url)}" target="_blank" rel="noopener">↗</a>` : ''}
        </label>`).join('')}
    </div>`).join(''));
}

function renderRetro() {
  if (!TRIP.retro) return;
  // changelog, missed, lessons — follow L()/t() rules; omitted from minimum skeleton.
}

// Boot
document.addEventListener('DOMContentLoaded', bootstrap);
```

## Hard rules for renderer bodies

1. **Every visible string** is either `t('some.key')` or `L(obj)`. No literal `"Today"`, `"Total"`, `"Sunny"`, `"Day"`, etc.
2. **Never insert an i18n object directly into the DOM.** Wrong: `el.textContent = poi.desc`. Right: `el.textContent = L(poi.desc)`. Wrong: `` `<div>${poi.name}</div>` ``. Right: `` `<div>${escapeHtml(L(poi.name))}</div>` ``. Forgetting `L()` is the #1 cause of `[object Object]` in the rendered UI.
3. **Every city color** comes from `cityColor(id)` and is applied via inline `style="--city-color:..."` or `el.style.setProperty('--city-color', ...)`. Never written into a stylesheet rule.
4. **Every currency value** goes through `fmtMoney(n, code)`. No literal `"NT$"`, `"₩"`, `"¥"` in the JS.
5. **Every Material icon name** comes from JSON (e.g., `weather[].icon`, `cities[].icon`, `pois[].icon`). The skeleton may hardcode UI-chrome icons (the navigation icons themselves) but never trip data icons.
6. **Date formatting** uses `Intl.DateTimeFormat(LANG, ...)` — never hand-built `年/月/日` strings.
7. **No global module-scope arrays** like `WEATHER_DATA = [...]`. Always read from `TRIP.*`.
8. **No conditional language ladders** like `LANG === 'zh' ? '中文' : 'English'`. Use `t(key)`.
9. **Leaflet vs `L()` name collision.** Leaflet exposes itself as global `L`. Our localizer is also named `L`. They co-exist because `L` (no qualifier) inside renderer bodies refers to the locally-scoped function we defined; `window.L` is Leaflet. **Always use `window.L` when calling Leaflet** (`window.L.map('map')`, `window.L.tileLayer(...)`, `window.L.circleMarker(...)`). Never write bare `L.map(...)`.
10. **`#map` is bound exactly once,** inside `renderSpotsTab → initSpotsMap`. There is exactly one `<div id="map">` in `index.html`, inside `#tab-time`.

## Required `i18n` keys

The skeleton above references these keys. The Phase 5 generator MUST emit a value for each key under every entry in `supportedLangs`:

```
meta.title
tab.today    tab.spots    tab.calendar    tab.budget    tab.booking    tab.checklist    tab.retro
label.total  label.booked  label.estimated  label.actual  label.dailyAvg  label.poiCount  label.workDays  label.days
empty.no_events    empty.no_actuals    empty.no_changes
action.export      action.copy         action.save_for_next_trip
status.purchased   status.to_purchase  status.under_budget   status.over_budget
flight.below_avg   flight.near_avg     flight.above_avg
crowd.low          crowd.med           crowd.high
cat.attraction     cat.food            cat.cafe              cat.shopping
cat.transport      cat.work            cat.hotel             cat.other
```

Renderers may add more keys as needed; if a key is missing, `t(key)` returns the key itself, which is easy to grep for.

## Updating the trip = editing JSON only

Once the skeleton is generated for a trip, the user (or the trip-planner skill in update mode) only edits `data/trip.json`. The HTML/CSS/JS shell is identical across every trip.
