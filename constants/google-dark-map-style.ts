import type { MapStyleElement } from 'react-native-maps';

/**
 * Custom Google Maps styling for Android (`MapView.customMapStyle`).
 * Tuned toward Split-the-G browns — iOS defaults to Apple Maps, which ignores this;
 * combine with `mapType="mutedStandard"` there for a softer backdrop.
 */
export const GOOGLE_MAP_DARK_STYLE: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#15120e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#b8a88a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b0b0b' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#252019' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#3a3120' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{ color: '#2e281a' }],
  },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#0c1018' }],
  },
];
