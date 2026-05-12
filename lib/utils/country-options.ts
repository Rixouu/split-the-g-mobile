import countries from 'i18n-iso-countries';
import type { LocaleData } from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(enLocale as LocaleData);

export interface CountryOption {
  code: string;
  name: string;
}

let cached: CountryOption[] | null = null;

/** ISO 3166-1 alpha-2 list with English names — matches web `getCountryOptions`. */
export function getCountryOptions(): CountryOption[] {
  if (cached) return cached;
  const names = countries.getNames('en', { select: 'official' });
  cached = Object.entries(names)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return cached;
}
