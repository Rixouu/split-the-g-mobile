import { DEFAULT_PUB_GEOFENCE_MAX_METERS, haversineDistanceMeters } from '../geo-distance';

describe('haversineDistanceMeters', () => {
  it('returns ~0 for identical points', () => {
    const p = { lat: 51.5074, lng: -0.1278 };
    expect(haversineDistanceMeters(p, p)).toBeLessThan(1);
  });

  it('returns expected order of magnitude for London to Paris', () => {
    const london = { lat: 51.5074, lng: -0.1278 };
    const paris = { lat: 48.8566, lng: 2.3522 };
    const meters = haversineDistanceMeters(london, paris);
    expect(meters).toBeGreaterThan(330_000);
    expect(meters).toBeLessThan(350_000);
  });
});

describe('DEFAULT_PUB_GEOFENCE_MAX_METERS', () => {
  it('matches documented pub geofence radius', () => {
    expect(DEFAULT_PUB_GEOFENCE_MAX_METERS).toBe(200);
  });
});
