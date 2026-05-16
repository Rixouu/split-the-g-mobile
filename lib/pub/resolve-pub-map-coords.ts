import * as Location from 'expo-location';

import { fetchPlaceDetails, geocodeAddress, geocodeByPlaceId } from '@/lib/places/google-places';

/**
 * Google Maps URLs often embed camera position as `@lat,lng,zoom` or `!3dlat!4dlng`.
 * Parsing these avoids Geocoding / Places REST when the directory stores a share link only.
 */
export function tryParseLatLngFromMapsUrl(url: string | null | undefined): { lat: number; lng: number } | null {
  if (!url?.trim()) return null;
  let u = url.trim();
  try {
    u = decodeURIComponent(u);
  } catch {
    /* keep raw */
  }

  const at = u.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (at) {
    const lat = Number(at[1]);
    const lng = Number(at[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }

  const bang = u.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (bang) {
    const lat = Number(bang[1]);
    const lng = Number(bang[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }

  return null;
}

function tryExtractPlaceIdFromMapsUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const m = url.match(/[?&]query_place_id=([^&]+)/i);
  if (m) return decodeURIComponent(m[1]).trim();
  return null;
}

function uniqueGeocodeQueries(displayName: string, sampleAddress: string | null): string[] {
  const name = displayName.trim();
  const addr = (sampleAddress ?? '').trim();
  const out: string[] = [];
  const push = (q: string) => {
    const t = q.trim();
    if (t && !out.includes(t)) out.push(t);
  };
  if (addr) push(addr);
  if (name && addr) push(`${name}, ${addr}`);
  if (name) push(name);
  return out;
}

/**
 * Follow redirects from short / cid-only Maps URLs so we can parse `@lat,lng` from the final URL.
 */
async function tryCoordsAfterMapsRedirect(url: string | null | undefined): Promise<{ lat: number; lng: number } | null> {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  const parsed = tryParseLatLngFromMapsUrl(trimmed);
  if (parsed) return parsed;
  const looksExpandable =
    /[?&]cid=/i.test(trimmed) ||
    /goo\.gl\//i.test(trimmed) ||
    /maps\.app\.goo\.gl/i.test(trimmed);
  if (!looksExpandable) return null;
  try {
    const res = await fetch(trimmed, {
      method: 'GET',
      redirect: 'follow',
      headers: { Accept: 'text/html' },
    });
    const finalUrl = res.url;
    if (typeof finalUrl === 'string' && finalUrl !== trimmed) {
      return tryParseLatLngFromMapsUrl(finalUrl);
    }
  } catch {
    /* offline / blocked */
  }
  return null;
}

/**
 * Fallback when Places / Geocode REST rejects the key (e.g. Maps SDK-only–restricted keys).
 * Uses the platform geocoder (Google Play / Core Location) via Expo.
 */
async function geocodeWithDeviceGeocoder(query: string): Promise<{ lat: number; lng: number } | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  try {
    const hits = await Location.geocodeAsync(trimmed);
    const hit = hits[0];
    if (hit != null && Number.isFinite(hit.latitude) && Number.isFinite(hit.longitude)) {
      return { lat: hit.latitude, lng: hit.longitude };
    }
  } catch {
    /* service unavailable — REST may already have failed too */
  }
  return null;
}

/**
 * Resolves approximate map coordinates for directory + detail flows.
 * Prefer: DB cache, embedded coords in `mapsPlaceUrl`, redirect-expanded cid URLs, Place Details,
 * Geocoding-by-place-id, address/name geocode, device geocoder.
 */
export async function resolvePubMapCoords(
  placeId: string | null,
  displayName: string,
  sampleAddress: string | null,
  mapsPlaceUrl: string | null = null,
  cachedCoords: { lat: number; lng: number } | null = null,
): Promise<{ lat: number; lng: number } | null> {
  if (
    cachedCoords != null &&
    Number.isFinite(cachedCoords.lat) &&
    Number.isFinite(cachedCoords.lng)
  ) {
    return { lat: cachedCoords.lat, lng: cachedCoords.lng };
  }

  const fromMaps = tryParseLatLngFromMapsUrl(mapsPlaceUrl);
  if (fromMaps) return fromMaps;

  const fromRedirect = await tryCoordsAfterMapsRedirect(mapsPlaceUrl);
  if (fromRedirect) return fromRedirect;

  const trimmedPlaceId = placeId?.trim() || tryExtractPlaceIdFromMapsUrl(mapsPlaceUrl);
  if (trimmedPlaceId) {
    const details = await fetchPlaceDetails(trimmedPlaceId);
    if (details && Number.isFinite(details.lat) && Number.isFinite(details.lng)) {
      return { lat: details.lat, lng: details.lng };
    }
    const fromPlaceGeocode = await geocodeByPlaceId(trimmedPlaceId);
    if (fromPlaceGeocode) return fromPlaceGeocode;
  }

  const queries = uniqueGeocodeQueries(displayName, sampleAddress);
  if (queries.length === 0) return null;

  for (const q of queries) {
    const fromRest = await geocodeAddress(q);
    if (fromRest) return fromRest;
  }

  for (const q of queries) {
    const fromDevice = await geocodeWithDeviceGeocoder(q);
    if (fromDevice) return fromDevice;
  }

  return null;
}
