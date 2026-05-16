/**
 * Backfill pub_place_details.latitude / longitude when null.
 *
 * Does not use Geocoding/Places REST (your EXPO_PUBLIC key is usually app-restricted).
 * Fetches the public Google Maps HTML for `maps_place_url` (cid= links), extracts a short
 * Plus Code near "Bangkok", recovers full code with open-location-code, writes WGS84 center.
 *
 * Requires in .env (use `node --env-file=.env`):
 *   EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node --env-file=.env scripts/backfill-pub-place-coordinates.mjs
 */

import { createRequire } from 'module';

import { createClient } from '@supabase/supabase-js';

const require = createRequire(import.meta.url);
const { OpenLocationCode } = require('open-location-code');

const BANGKOK_REF = { lat: 13.75, lng: 100.52 };
const USER_AGENT = 'SplitTheG-Mobile/1.0 (pub-coordinate-backfill; +https://www.split-the-g.app)';

const plusNearBangkok = new RegExp(
  '([2-9CFGHJMPQRVWX]{4,8}\\+[2-9CFGHJMPQRVWX]{2,3})\\s*,?\\s*Bangkok',
  'i',
);

function coordsFromShortPlusCode(shortWithPlus) {
  const olc = new OpenLocationCode();
  const full = olc.recoverNearest(shortWithPlus.trim(), BANGKOK_REF.lat, BANGKOK_REF.lng);
  const box = olc.decode(full);
  return { lat: box.latitudeCenter, lng: box.longitudeCenter };
}

async function fetchPlusCodeFromCidUrl(mapsUrl) {
  const cid = mapsUrl.match(/[?&]cid=([^&]+)/i)?.[1];
  if (!cid) return null;
  const pageUrl = `https://www.google.com/maps?cid=${encodeURIComponent(cid)}`;
  const res = await fetch(pageUrl, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,*/*' },
    redirect: 'follow',
  });
  const html = await res.text();
  const m = html.match(plusNearBangkok);
  if (!m) return null;
  return m[1].toUpperCase().replace(/\s+/g, '');
}

async function main() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    console.error('Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);
  const { data: rows, error } = await supabase
    .from('pub_place_details')
    .select('bar_key, maps_place_url, latitude, longitude')
    .or('latitude.is.null,longitude.is.null');

  if (error) throw error;
  if (!rows?.length) {
    console.log('No rows missing coordinates.');
    return;
  }

  let updated = 0;
  for (const row of rows) {
    const mapsUrl = row.maps_place_url?.trim();
    if (!mapsUrl) {
      console.warn(`Skip (no maps_place_url): ${row.bar_key}`);
      continue;
    }
    let coords = null;
    try {
      const shortCode = await fetchPlusCodeFromCidUrl(mapsUrl);
      if (shortCode) coords = coordsFromShortPlusCode(shortCode);
    } catch (e) {
      console.warn(`Fetch failed for ${row.bar_key}:`, e?.message ?? e);
    }
    if (!coords) {
      console.warn(`Could not resolve Plus Code: ${row.bar_key}`);
      continue;
    }
    const { error: upErr } = await supabase
      .from('pub_place_details')
      .update({
        latitude: coords.lat,
        longitude: coords.lng,
        location_resolved_at: new Date().toISOString(),
      })
      .eq('bar_key', row.bar_key);
    if (upErr) throw upErr;
    updated += 1;
    console.log(`Updated ${row.bar_key}: ${coords.lat}, ${coords.lng}`);
  }
  console.log(`Done. Updated ${updated} / ${rows.length}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
