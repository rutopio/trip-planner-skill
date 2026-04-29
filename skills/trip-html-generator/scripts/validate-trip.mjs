#!/usr/bin/env node
// =============================================================
// validate-trip.mjs
//
// Enforces the template contract for a generated trip folder.
// Usage:
//   node validate-trip.mjs <trip-folder>
//
// Exits 0 on success, 1 on any violation. Prints a per-rule report.
//
// Checks:
//   1. Required files exist: index.html, style.css, app.js, data/trip.json
//   2. trip.json passes shape validation (lang, supportedLangs, cities, i18n,
//      pois, schedule, currency, dates).
//   3. trip.json `i18n` covers all `supportedLangs` and required UI keys.
//   4. trip.json `pois[].city`, `schedule[].city`, `weather[].city` all
//      reference an id present in `cities[]`.
//   5. index.html / app.js / style.css contain ZERO trip-specific tokens
//      (city names, currency codes, attraction names, taglines).
//   6. style.css contains no per-city selectors (e.g. `.wd-city-busan`).
//   7. app.js does not declare module-scope literal arrays for trip data
//      (WEATHER_DATA, POIS, SCHEDULE).
//   8. trip.json uses ONLY nested i18n objects, never flat sibling keys
//      (name_en, name_ja, note_en, etc.) for user-visible fields.
//   9. index.html has exactly one id="map" and it lives inside #tab-time.
//  10. app.js does not interpolate raw i18n objects into the DOM (heuristic
//      pattern: ${X.name} where X is a likely i18n holder — warning only).
// =============================================================

import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { argv, exit } from 'node:process';

const REQUIRED_I18N_KEYS = [
  'meta.title',
  'tab.today', 'tab.spots', 'tab.calendar', 'tab.budget',
  'tab.booking', 'tab.checklist', 'tab.retro',
  'label.total', 'label.booked', 'label.estimated', 'label.actual',
  'empty.no_events',
];

const FORBIDDEN_GLOBAL_ARRAYS = [
  /\bWEATHER_DATA\s*=/,
  /\bPOIS\s*=/,
  /\bSCHEDULE\s*=/,
  /\bSCHEDULE_CITY_I18N\s*=/,
];

class Report {
  constructor() { this.errors = []; this.warnings = []; }
  err(rule, msg)  { this.errors.push({ rule, msg }); }
  warn(rule, msg) { this.warnings.push({ rule, msg }); }
  print() {
    for (const w of this.warnings) console.warn(`WARN [${w.rule}] ${w.msg}`);
    for (const e of this.errors)  console.error(`FAIL [${e.rule}] ${e.msg}`);
    const ok = this.errors.length === 0;
    console.log(ok ? `\nOK — template contract holds.` : `\n${this.errors.length} violation(s).`);
    return ok;
  }
}

function readJSON(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function checkRequiredFiles(root, r) {
  const required = ['index.html', 'style.css', 'app.js', 'data/trip.json'];
  for (const rel of required) {
    const p = join(root, rel);
    if (!existsSync(p) || !statSync(p).isFile()) {
      r.err('files', `missing: ${rel}`);
    }
  }
}

function checkTripShape(trip, r) {
  const required = ['lang', 'supportedLangs', 'destination', 'startDate', 'endDate', 'currency', 'cities', 'i18n', 'pois', 'schedule'];
  for (const k of required) {
    if (!(k in trip)) r.err('schema', `trip.json missing top-level field: ${k}`);
  }
  if (trip.supportedLangs && !trip.supportedLangs.includes(trip.lang)) {
    r.err('schema', `trip.lang "${trip.lang}" not in supportedLangs`);
  }
  if (trip.currency && !trip.currency.home) {
    r.err('schema', 'currency.home missing');
  }
  if (Array.isArray(trip.cities) && trip.cities.length === 0) {
    r.err('schema', 'cities[] is empty — at least one city required');
  }
}

function checkI18nCoverage(trip, r) {
  if (!trip.i18n || !Array.isArray(trip.supportedLangs)) return;
  for (const lang of trip.supportedLangs) {
    const dict = trip.i18n[lang];
    if (!dict) {
      r.err('i18n', `i18n.${lang} block missing`);
      continue;
    }
    for (const key of REQUIRED_I18N_KEYS) {
      if (!(key in dict) || typeof dict[key] !== 'string' || !dict[key].trim()) {
        r.err('i18n', `i18n.${lang} missing required key: ${key}`);
      }
    }
  }
}

function checkCityReferences(trip, r) {
  const ids = new Set((trip.cities || []).map(c => c.id));
  const refs = [
    ['pois',     trip.pois     || []],
    ['schedule', trip.schedule || []],
    ['weather',  trip.weather  || []],
  ];
  for (const [name, arr] of refs) {
    for (const item of arr) {
      if (item.city && !ids.has(item.city)) {
        r.err('city-ref', `${name}[] references unknown city id "${item.city}"`);
      }
    }
  }
  // Every city must carry color + name
  for (const c of trip.cities || []) {
    if (!c.id) r.err('city-ref', 'cities[] entry missing id');
    if (!c.color) r.err('city-ref', `city "${c.id}" missing color`);
    if (!c.name || typeof c.name !== 'object') r.err('city-ref', `city "${c.id}" missing i18n name`);
  }
}

function buildForbiddenTokenList(trip) {
  const tokens = new Set();
  // City ids (allow these in JS — they're keys, not display strings) -> NOT forbidden
  // City display names ARE forbidden in HTML/CSS/JS
  for (const c of trip.cities || []) {
    if (c.name && typeof c.name === 'object') {
      for (const v of Object.values(c.name)) if (typeof v === 'string') tokens.add(v);
    }
  }
  // Destination string
  if (typeof trip.destination === 'string') tokens.add(trip.destination);
  // Tagline values
  if (trip.tagline && typeof trip.tagline === 'object') {
    for (const v of Object.values(trip.tagline)) if (typeof v === 'string') tokens.add(v);
  }
  // Currency codes other than home (home may legitimately appear in JS via Intl, but we still ban literals;
  // the skeleton uses TRIP.currency.home, never literals)
  for (const code of Object.keys((trip.currency && trip.currency.rates) || {})) tokens.add(code);
  if (trip.currency && trip.currency.home) tokens.add(trip.currency.home);
  // POI display names
  for (const p of trip.pois || []) {
    if (p.name && typeof p.name === 'object') {
      for (const v of Object.values(p.name)) if (typeof v === 'string') tokens.add(v);
    } else if (typeof p.name === 'string') {
      tokens.add(p.name);
    }
    if (typeof p.nameLocal === 'string') tokens.add(p.nameLocal);
  }
  // Keep CJK tokens of length >= 2 (each CJK char carries meaning); for ASCII keep >= 3.
  return [...tokens].filter(s => {
    if (typeof s !== 'string' || !s.trim()) return false;
    const isCJK = /[　-鿿가-힯]/.test(s);
    return s.length >= (isCJK ? 2 : 3);
  });
}

function checkShellHasNoTripStrings(root, trip, r) {
  const tokens = buildForbiddenTokenList(trip);
  const files = ['index.html', 'app.js', 'style.css'];
  for (const f of files) {
    const path = join(root, f);
    if (!existsSync(path)) continue;
    const src = readFileSync(path, 'utf8');
    for (const tok of tokens) {
      if (src.includes(tok)) {
        // index.html allows the inline trip-data <script> which carries the JSON verbatim;
        // a hit there is OK if the surrounding context is the script tag.
        if (f === 'index.html' && isInsideTripDataScript(src, tok)) continue;
        r.err('no-trip-strings', `${f} contains trip-specific token: ${JSON.stringify(tok)}`);
      }
    }
  }
}

function isInsideTripDataScript(src, token) {
  const open = src.indexOf('<script id="trip-data"');
  if (open < 0) return false;
  const start = src.indexOf('>', open) + 1;
  const end = src.indexOf('</script>', start);
  if (end < 0) return false;
  const block = src.slice(start, end);
  return block.includes(token);
}

function checkNoPerCitySelectors(root, trip, r) {
  const cssPath = join(root, 'style.css');
  if (!existsSync(cssPath)) return;
  const css = readFileSync(cssPath, 'utf8');
  for (const c of trip.cities || []) {
    const re = new RegExp(`\\.[a-zA-Z-]*${escapeRegex(c.id)}\\b`);
    if (re.test(css)) {
      r.err('no-per-city-css', `style.css contains a per-city selector for "${c.id}"`);
    }
  }
}

function checkNoLiteralTripArrays(root, r) {
  const jsPath = join(root, 'app.js');
  if (!existsSync(jsPath)) return;
  const src = readFileSync(jsPath, 'utf8');
  for (const re of FORBIDDEN_GLOBAL_ARRAYS) {
    if (re.test(src)) {
      r.err('no-literal-arrays', `app.js declares forbidden module-scope name: ${re}`);
    }
  }
}

function checkNoFlatI18nKeys(trip, r) {
  // Walk the trip tree; flag any object that has both `name` (or `note`, `desc`,
  // `task`, `label`, `tagline`, `title`) and a sibling key like `name_en`.
  // The ONLY allowed format is the nested object: { zh: ..., en: ..., ... }.
  const SUFFIX_RE = /^(name|note|desc|task|label|title|tagline|deadline|reason|lesson|description|item|restaurant|booking_note|addr|nameLocal|place)_(zh|en|ja|ko)$/;
  function walk(node, path) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach((child, i) => walk(child, `${path}[${i}]`));
      return;
    }
    for (const k of Object.keys(node)) {
      if (SUFFIX_RE.test(k)) {
        r.err('flat-i18n', `${path}.${k} uses forbidden flat-sibling i18n key. Use nested i18n object instead.`);
      }
    }
    for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
  }
  walk(trip, '$');

  // Inverse: detect bare-string user-visible fields. These keys are expected to
  // hold an i18n object; if the value is a string, that's also a violation.
  const STRING_KEYS = ['tagline', 'desc', 'tip', 'addr', 'nameLocal', 'restaurant', 'booking_note', 'task', 'deadline', 'lesson', 'description'];
  function walk2(node, path) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach((c, i) => walk2(c, `${path}[${i}]`)); return; }
    for (const [k, v] of Object.entries(node)) {
      if (STRING_KEYS.includes(k) && typeof v === 'string') {
        r.err('bare-string-i18n', `${path}.${k} is a bare string but must be a nested i18n object.`);
      }
      walk2(v, `${path}.${k}`);
    }
  }
  walk2(trip, '$');
}

function checkMapPlacement(root, r) {
  const indexPath = join(root, 'index.html');
  if (!existsSync(indexPath)) return;
  const html = readFileSync(indexPath, 'utf8');
  const matches = [...html.matchAll(/\bid\s*=\s*["']map["']/g)];
  if (matches.length === 0) {
    r.err('map-placement', `index.html has no id="map" — Spots tab cannot render Leaflet`);
    return;
  }
  if (matches.length > 1) {
    r.err('map-placement', `index.html has ${matches.length} elements with id="map" — there must be exactly one`);
  }
  // The single map must live within <section ... id="tab-time">.
  const mapIdx = matches[0].index;
  const tabTimeStart = html.search(/<section[^>]*\bid\s*=\s*["']tab-time["']/);
  if (tabTimeStart < 0) {
    r.err('map-placement', `index.html has no <section id="tab-time"> — Spots tab is missing`);
    return;
  }
  const tabTimeEnd = (() => {
    // Walk forward from tabTimeStart looking for the matching </section>.
    // Cheap heuristic: find the next </section> after the start.
    return html.indexOf('</section>', tabTimeStart);
  })();
  if (tabTimeEnd < 0 || mapIdx < tabTimeStart || mapIdx > tabTimeEnd) {
    r.err('map-placement', `id="map" must be inside <section id="tab-time"> (Spots tab), found elsewhere`);
  }
}

function checkRequiredMountPoints(root, r) {
  const indexPath = join(root, 'index.html');
  if (!existsSync(indexPath)) return;
  const html = readFileSync(indexPath, 'utf8');
  const required = [
    'tab-attractions', 'tab-calendar', 'tab-booking', 'tab-budget', 'tab-time', 'tab-checklist', 'tab-retro',
    'stats-bar', 'today-card', 'weather-strip',
    'calendar-desktop',
    'flight-intel', 'booking-purchased',
    'budget-detail',
    'poi-filters', 'map', 'poi-list',
    'checklist-groups',
  ];
  for (const id of required) {
    if (!new RegExp(`\\bid\\s*=\\s*["']${id}["']`).test(html)) {
      r.err('mount-points', `index.html missing required mount: id="${id}"`);
    }
  }
}

function checkNoRawObjectInterpolation(root, r) {
  const jsPath = join(root, 'app.js');
  if (!existsSync(jsPath)) return;
  const src = readFileSync(jsPath, 'utf8');
  // Heuristic: ${something.name} or ${something.desc} etc. WITHOUT being wrapped
  // in L( ). We look for `${ident.field}` patterns where field is a known i18n
  // holder, and the surrounding chars don't form `L(ident.field)`.
  const I18N_FIELDS = ['name', 'desc', 'note', 'tagline', 'title', 'task', 'label', 'deadline', 'reason', 'lesson', 'description', 'restaurant', 'addr', 'nameLocal', 'booking_note'];
  for (const f of I18N_FIELDS) {
    const re = new RegExp(`\\$\\{[^}]*\\.${f}\\b[^}]*\\}`, 'g');
    let m;
    while ((m = re.exec(src)) !== null) {
      const block = m[0];
      // Allow if the field reference is wrapped in L(...) somewhere in the block.
      if (new RegExp(`L\\([^)]*\\.${f}\\b`).test(block)) continue;
      // Allow URL/href contexts (e.g. ${item.url}) — those are not i18n holders.
      r.warn('raw-i18n-interp', `app.js may interpolate raw i18n object: ${block.slice(0, 80)}`);
    }
  }
}

function checkNoConditionalLangLadders(root, r) {
  const jsPath = join(root, 'app.js');
  if (!existsSync(jsPath)) return;
  const src = readFileSync(jsPath, 'utf8');
  // Patterns like  isZh ? '中文' : 'English'  or  lang === 'zh' ? ... : ...
  const ladder = /\b(isZh|isJa|isKo|isEn|lang|LANG)\s*===?\s*['"](zh|en|ja|ko)['"]\s*\?/;
  if (ladder.test(src)) {
    r.warn('lang-ladder', `app.js appears to use a conditional language ladder; prefer t(key) lookups`);
  }
}

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ---------- main ----------

const args = argv.slice(2).filter(a => !a.startsWith('--'));
const flags = new Set(argv.slice(2).filter(a => a.startsWith('--')));
const schemaOnly = flags.has('--schema-only');
const folder = args[0];
if (!folder) {
  console.error('usage: node validate-trip.mjs <trip-folder> [--schema-only]');
  console.error('  --schema-only: validate data/trip.json shape + i18n only (skip HTML/CSS/JS checks).');
  console.error('                 Use this mid-generation, before index.html/app.js/style.css are written.');
  exit(2);
}
const root = resolve(folder);
const r = new Report();

if (!schemaOnly) {
  checkRequiredFiles(root, r);
}

let trip = null;
const tripPath = join(root, 'data/trip.json');
if (existsSync(tripPath)) {
  try { trip = readJSON(tripPath); }
  catch (e) { r.err('schema', `data/trip.json is not valid JSON: ${e.message}`); }
} else if (schemaOnly) {
  r.err('files', `missing: data/trip.json (required for --schema-only)`);
}

if (trip) {
  checkTripShape(trip, r);
  checkI18nCoverage(trip, r);
  checkCityReferences(trip, r);
  checkNoFlatI18nKeys(trip, r);
  if (!schemaOnly) {
    checkShellHasNoTripStrings(root, trip, r);
    checkNoPerCitySelectors(root, trip, r);
    checkNoLiteralTripArrays(root, r);
    checkNoConditionalLangLadders(root, r);
    checkNoRawObjectInterpolation(root, r);
    checkMapPlacement(root, r);
    checkRequiredMountPoints(root, r);
  }
}

const ok = r.print();
exit(ok ? 0 : 1);
