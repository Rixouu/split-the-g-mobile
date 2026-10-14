import { Platform } from 'react-native';
import type { MapStyleElement, MapViewProps } from 'react-native-maps';

/**
 * Custom Google Maps styling for Android (`MapView.customMapStyle`).
 * Tuned toward Split-the-G browns. The iOS Apple Maps provider uses its native
 * dark appearance instead of Google's JSON styling.
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

/** Keep every embedded map dark, even when the phone uses light appearance. */
export const DARK_MAP_PROPS = {
  userInterfaceStyle: 'dark',
  mapType: Platform.OS === 'ios' ? 'mutedStandard' : 'standard',
  customMapStyle: Platform.OS === 'android' ? GOOGLE_MAP_DARK_STYLE : undefined,
} satisfies Pick<MapViewProps, 'userInterfaceStyle' | 'mapType' | 'customMapStyle'>;
