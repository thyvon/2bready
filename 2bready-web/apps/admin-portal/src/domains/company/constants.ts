import type { useTranslation } from '@/lib/i18n';
import type { Locale } from '@/store/locale.store';
import type { User } from '@/domains/user/types';
import type { CompanyStatus, Industry } from './types';

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

// Reuses the app-wide common.active/suspended/inactive keys (already the
// labels StatusBadge and CompanyUsersListView's status select show) rather
// than a company-specific duplicate set.
export const STATUS_OPTIONS: { value: CompanyStatus; labelKey: TranslationKey }[] = [
  { value: 'active', labelKey: 'common.active' },
  { value: 'suspended', labelKey: 'common.suspended' },
  { value: 'inactive', labelKey: 'common.inactive' },
];

export function optionLabel(t: T, options: Option[], value: string): string {
  const option = options.find((o) => o.value === value);
  return option ? t(option.labelKey) : value;
}

// Role is global-per-user (spatie), not scoped per company_user pivot row —
// this reads whichever of the two company-side roles applies to this user in
// the context of a specific company's user list. Shared by CompanyUsersListView
// (Users tab) and the Overview tab's Company Owner card.
export type CompanyRole = 'company_owner' | 'company_member';

export function companyRoleOf(user: User): CompanyRole {
  return user.roles.includes('company_owner') ? 'company_owner' : 'company_member';
}
