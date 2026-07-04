import type { useTranslation } from '@/lib/i18n';

type T = ReturnType<typeof useTranslation>['t'];
type TranslationKey = Parameters<T>[0];

interface Option {
  value: string;
  labelKey: TranslationKey;
}

export const INDUSTRY_OPTIONS: Option[] = [
  { value: 'F&B', labelKey: 'company.industry.fnb' },
  { value: 'RETAIL', labelKey: 'company.industry.retail' },
  { value: 'MANUFACTURING', labelKey: 'company.industry.manufacturing' },
  { value: 'SERVICES', labelKey: 'company.industry.services' },
  { value: 'OTHER', labelKey: 'company.industry.other' },
];

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
