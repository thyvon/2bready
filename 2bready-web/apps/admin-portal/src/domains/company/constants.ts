import type { useTranslation } from '@/lib/i18n';
import type { Locale } from '@/store/locale.store';
import type { Industry } from './types';

type T = ReturnType<typeof useTranslation>['t'];
type TranslationKey = Parameters<T>[0];

interface Option {
  value: string;
  labelKey: TranslationKey;
}

// Industry is real, admin-managed reference data (see the Industry domain on
// the backend) — no static option list here. Fetch via useIndustries() and
// label with industryLabel() below instead.
export function industryLabel(industry: Industry, locale: Locale): string {
  return locale === 'kh' && industry.name_kh ? industry.name_kh : industry.name;
}

export const COUNTRY_OPTIONS: Option[] = [
  { value: 'KH', labelKey: 'company.country.kh' },
  { value: 'VN', labelKey: 'company.country.vn' },
  { value: 'TH', labelKey: 'company.country.th' },
  { value: 'XX', labelKey: 'company.country.other' },
];

export const LOCALE_OPTIONS: Option[] = [
  { value: 'en', labelKey: 'company.locale.en' },
  { value: 'kh', labelKey: 'company.locale.kh' },
];

export function optionLabel(t: T, options: Option[], value: string): string {
  const option = options.find((o) => o.value === value);
  return option ? t(option.labelKey) : value;
}
