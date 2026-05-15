#!/usr/bin/env node
/**
 * Builds `lib/i18n/web-locale-patches/` JSON files from the web app i18n tree
 * at ../split-the-g/app/i18n/messages, using English string matching + a manual
 * bridge map from mobile TranslationKey to web dotted keys.
 *
 * Run from repo root: node scripts/build-web-locale-overrides.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const WEB_MESSAGES = path.resolve(REPO_ROOT, '../split-the-g/app/i18n/messages');
const OUT_DIR = path.join(REPO_ROOT, 'lib/i18n/web-locale-patches');
const TRANSLATIONS_TS = path.join(REPO_ROOT, 'lib/i18n/translations.ts');
const EXTRA_MAP_JSON = path.join(REPO_ROOT, 'lib/i18n/web-i18n-extra-map.json');

const TARGET_LOCALES = ['th', 'fr', 'es', 'de', 'it', 'ja'];

function isRecord(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function norm(s) {
  return String(s)
    .replace(/\u2026/g, '...')
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .trim();
}

function walkFlat(prefix, node, out) {
  for (const [k, v] of Object.entries(node)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[key] = v;
    else if (isRecord(v)) walkFlat(key, v, out);
  }
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadLocaleBundle(lang) {
  const dir = path.join(WEB_MESSAGES, lang);
  const pageDir = path.join(dir, 'pages');
  const pages = {};
  for (const fname of fs.readdirSync(pageDir)) {
    if (!fname.endsWith('.json')) continue;
    pages[fname.replace(/\.json$/, '')] = readJson(path.join(pageDir, fname));
  }
  return {
    common: readJson(path.join(dir, 'common.json')),
    nav: readJson(path.join(dir, 'nav.json')),
    seo: readJson(path.join(dir, 'seo.json')),
    auth: readJson(path.join(dir, 'auth.json')),
    languages: readJson(path.join(dir, 'languages.json')),
    toasts: readJson(path.join(dir, 'toasts.json')),
    errors: readJson(path.join(dir, 'errors.json')),
    pages,
  };
}

function deepMerge(base, over) {
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) {
    if (v === undefined) continue;
    const prev = out[k];
    if (isRecord(v) && isRecord(prev)) out[k] = deepMerge(prev, v);
    else out[k] = v;
  }
  return out;
}

function extractMobileEnStrings(ts) {
  const start = ts.indexOf('en: {');
  if (start < 0) throw new Error('Could not find en: { block in translations.ts');
  let i = start + 'en: {'.length;
  let depth = 1;
  const out = {};
  const skipWs = () => {
    while (/\s/.test(ts[i])) i++;
  };
  while (i < ts.length && depth > 0) {
    skipWs();
    if (depth === 1 && /[a-zA-Z0-9_]/.test(ts[i])) {
      const km = ts.slice(i).match(/^([a-zA-Z0-9_]+)\s*:\s*/);
      if (!km) {
        i++;
        continue;
      }
      const field = km[1];
      i += km[0].length;
      skipWs();
      const q = ts[i];
      if (q !== "'" && q !== '"') {
        i++;
        continue;
      }
      i++;
      let buf = '';
      while (i < ts.length) {
        const c = ts[i];
        if (c === '\\') {
          const n = ts[i + 1];
          if (n === 'n') {
            buf += '\n';
            i += 2;
            continue;
          }
          buf += n ?? '';
          i += 2;
          continue;
        }
        if (c === q) {
          i++;
          break;
        }
        buf += c;
        i++;
      }
      out[field] = buf;
      skipWs();
      if (ts[i] === ',') i++;
      continue;
    }
    if (ts[i] === '{') depth++;
    else if (ts[i] === '}') depth--;
    i++;
  }
  return out;
}

function pickAmbiguous(mk, cands) {
  const score = (wk) => {
    let s = 0;
    if (wk.includes('pages.profile') && mk.startsWith('profile')) s += 5;
    if (wk.includes('pages.competitions') && (mk.startsWith('compete') || mk.startsWith('comp'))) s += 4;
    if (wk.includes('pages.home') && mk.startsWith('home')) s += 5;
    if (wk.includes('pages.score') && mk.startsWith('pour')) s += 4;
    if (wk.includes('pages.faq') && mk.startsWith('faq')) s += 5;
    if (wk.includes('pages.leaderboard') && mk.startsWith('lb')) s += 4;
    if (wk.includes('pages.wall') && mk.startsWith('wall')) s += 3;
    if (wk.includes('pages.pubDetail') && mk.startsWith('pubDetail')) s += 5;
    if (wk.includes('pages.pubs') && mk.startsWith('pubs')) s += 5;
    if (wk.includes('pages.feed') && mk.startsWith('feed')) s += 5;
    if (wk.includes('pages.competitionDetail') && mk.startsWith('competition')) s += 4;
    return s;
  };
  return [...cands].sort((a, b) => score(b) - score(a))[0];
}

function buildAutoMap(mobileStrings, enFlat) {
  const normInv = {};
  for (const [wk, v] of Object.entries(enFlat)) {
    const nv = norm(v);
    normInv[nv] = normInv[nv] || [];
    normInv[nv].push(wk);
  }
  const map = {};
  for (const [mk, mv] of Object.entries(mobileStrings)) {
    const cands = normInv[norm(mv)];
    if (!cands?.length) continue;
    map[mk] = cands.length > 1 ? pickAmbiguous(mk, cands) : cands[0];
  }
  return map;
}

function main() {
  if (!fs.existsSync(WEB_MESSAGES)) {
    console.error(`Web i18n path not found: ${WEB_MESSAGES}`);
    console.error('Expected split-the-g web repo as a sibling of split-the-g-mobile.');
    process.exit(1);
  }

  const enBundle = loadLocaleBundle('en');
  const enFlat = {};
  walkFlat('', enBundle, enFlat);

  const ts = fs.readFileSync(TRANSLATIONS_TS, 'utf8');
  const mobileEn = extractMobileEnStrings(ts);
  const autoMap = buildAutoMap(mobileEn, enFlat);

  const extraRaw = fs.existsSync(EXTRA_MAP_JSON) ? readJson(EXTRA_MAP_JSON) : {};
  const extra = extraRaw.mobileToWeb ?? extraRaw;

  const fullMap = { ...autoMap, ...extra };

  /** @type {Record<string, string>} */
  const missingWeb = {};
  for (const [mk, wk] of Object.entries(fullMap)) {
    if (!(wk in enFlat)) missingWeb[mk] = wk;
  }
  if (Object.keys(missingWeb).length) {
    console.error('Invalid web keys (not in EN flat bundle):');
    console.error(missingWeb);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const lang of TARGET_LOCALES) {
    const dir = path.join(WEB_MESSAGES, lang);
    if (!fs.existsSync(dir)) {
      console.warn(`Skipping ${lang}: no folder at ${dir}`);
      continue;
    }
    const langBundle = loadLocaleBundle(lang);
    /** Start from English so partial locale files still resolve every web path. */
    const merged = deepMerge(
      JSON.parse(JSON.stringify(enBundle)),
      JSON.parse(JSON.stringify(langBundle)),
    );
    const flat = {};
    walkFlat('', merged, flat);

    /** @type {Record<string,	string>} */
    const patch = {};
    for (const [mobileKey, webKey] of Object.entries(fullMap)) {
      const translated = flat[webKey];
      if (typeof translated === 'string' && translated !== mobileEn[mobileKey]) {
        patch[mobileKey] = translated;
      }
      if (typeof translated === 'string' && translated === mobileEn[mobileKey] && lang !== 'en') {
        /* still include if identical to EN — omit to reduce file size */
      }
    }

    const outPath = path.join(OUT_DIR, `${lang}.json`);
    fs.writeFileSync(outPath, `${JSON.stringify(patch, null, 2)}\n`);
    console.log(`${lang}: ${Object.keys(patch).length} keys patched`);
  }

  fs.writeFileSync(
    path.join(OUT_DIR, '_key-map.json'),
    `${JSON.stringify({ generatedNote: 'mobile TranslationKey -> web dotted path', map: fullMap }, null, 2)}\n`,
  );
  console.log(`Wrote patches to ${OUT_DIR}`);
}

main();
