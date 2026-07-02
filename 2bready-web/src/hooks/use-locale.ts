import { useAuthStore } from '@/store/auth.store';

type Locale = 'en' | 'kh';
type TranslatableField = Record<Locale, string> | string;

export function useLocale() {
  const user = useAuthStore((s) => s.user);
  const locale: Locale = (user?.locale as Locale) ?? 'en';

  function t(field: TranslatableField): string {
    if (typeof field === 'string') return field;
    return field[locale] ?? field['en'] ?? '';
  }

  return { locale, t };
}
