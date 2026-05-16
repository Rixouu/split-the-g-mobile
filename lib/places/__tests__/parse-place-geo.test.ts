import { parsePlaceGeoFromComponents, parsePlaceGeoFromLegacyComponents } from '../parse-place-geo';

describe('parsePlaceGeoFromComponents', () => {
  it('returns empty shape when components missing', () => {
    expect(parsePlaceGeoFromComponents(undefined)).toEqual({
      city: null,
      region: null,
      country: null,
      countryCode: null,
    });
  });

  it('maps Google-style address components', () => {
    const parsed = parsePlaceGeoFromComponents([
      { longText: 'Bangkok', shortText: 'Bangkok', types: ['locality', 'political'] },
      { longText: 'Bangkok', shortText: 'BKK', types: ['administrative_area_level_1', 'political'] },
      { longText: 'Thailand', shortText: 'TH', types: ['country', 'political'] },
    ]);
    expect(parsed.city).toBe('Bangkok');
    expect(parsed.region).toBe('Bangkok');
    expect(parsed.country).toBe('Thailand');
    expect(parsed.countryCode).toBe('TH');
  });

  it('fills city from sublocality when locality absent', () => {
    const parsed = parsePlaceGeoFromComponents([
      { longText: 'Silom', shortText: 'Silom', types: ['sublocality', 'political'] },
      { longText: 'Thailand', shortText: 'TH', types: ['country', 'political'] },
    ]);
    expect(parsed.city).toBe('Silom');
  });
});

describe('parsePlaceGeoFromLegacyComponents', () => {
  it('delegates to new shape after mapping long/short names', () => {
    const parsed = parsePlaceGeoFromLegacyComponents([
      { long_name: 'Paris', short_name: 'Paris', types: ['locality', 'political'] },
      { long_name: 'France', short_name: 'FR', types: ['country', 'political'] },
    ]);
    expect(parsed.city).toBe('Paris');
    expect(parsed.country).toBe('France');
    expect(parsed.countryCode).toBe('FR');
  });
});
