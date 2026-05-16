import * as Location from 'expo-location';

import { fetchPlaceDetails, geocodeAddress } from '@/lib/places/google-places';

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

/** Resolves approximate map coordinates for directory + detail flows. */
export async function resolvePubMapCoords(
  placeId: string | null,
  displayName: string,
  sampleAddress: string | null,
): Promise<{ lat: number; lng: number } | null> {
  const trimmedPlaceId = placeId?.trim();
  if (trimmedPlaceId) {
    const details = await fetchPlaceDetails(trimmedPlaceId);
    if (details && Number.isFinite(details.lat) && Number.isFinite(details.lng)) {
      return { lat: details.lat, lng: details.lng };
    }
  }
  const geoQuery = [displayName.trim(), (sampleAddress ?? '').trim()].filter(Boolean).join(', ');
  if (!geoQuery) return null;

  const fromRest = await geocodeAddress(geoQuery);
  if (fromRest) return fromRest;

  return geocodeWithDeviceGeocoder(geoQuery);
}
