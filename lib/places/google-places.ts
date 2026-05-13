import { appConfig } from '@/lib/config';

import type { ParsedPlaceGeo } from '@/lib/places/parse-place-geo';
import { parsePlaceGeoFromLegacyComponents } from '@/lib/places/parse-place-geo';

export interface PlaceAutocompleteItem {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetailsSelection {
  placeId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  geo: ParsedPlaceGeo;
}

export async function fetchPlaceAutocomplete(input: string): Promise<PlaceAutocompleteItem[]> {
  const key = appConfig.googleMapsApiKey?.trim();
  if (!key || input.trim().length < 2) return [];

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input.trim())}&key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  const json = (await res.json()) as {
    status: string;
    predictions?: {
      place_id: string;
      description: string;
      structured_formatting?: { main_text: string; secondary_text?: string };
    }[];
  };

  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') return [];

  return (json.predictions ?? []).map((p) => ({
    placeId: p.place_id,
    description: p.description,
    mainText: p.structured_formatting?.main_text ?? p.description,
    secondaryText: p.structured_formatting?.secondary_text ?? '',
  }));
}

/** Resolve free-text address or venue name to coordinates (Geocoding API). */
export async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
  const key = appConfig.googleMapsApiKey?.trim();
  if (!key || !query.trim()) return null;

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query.trim())}&key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  const json = (await res.json()) as {
    status: string;
    results?: { geometry?: { location: { lat: number; lng: number } } }[];
  };

  if (json.status !== 'OK' || !json.results?.length) return null;
  const loc = json.results[0]?.geometry?.location;
  if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) return null;
  return { lat: loc.lat, lng: loc.lng };
}

export async function fetchPlaceDetails(placeId: string): Promise<PlaceDetailsSelection | null> {
  const key = appConfig.googleMapsApiKey?.trim();
  if (!key) return null;

  const fields = encodeURIComponent('place_id,name,formatted_address,geometry,address_component');
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  const json = (await res.json()) as {
    status: string;
    result?: {
      place_id: string;
      name: string;
      formatted_address: string;
      geometry?: { location: { lat: number; lng: number } };
      address_components?: { long_name: string; short_name: string; types: string[] }[];
    };
  };

  if (json.status !== 'OK' || !json.result?.geometry?.location) return null;

  const r = json.result;
  const loc = r.geometry?.location;
  if (!loc) return null;

  return {
    placeId: r.place_id,
    name: r.name ?? '',
    formattedAddress: r.formatted_address ?? '',
    lat: loc.lat,
    lng: loc.lng,
    geo: parsePlaceGeoFromLegacyComponents(r.address_components),
  };
}
