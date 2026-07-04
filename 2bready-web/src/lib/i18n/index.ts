import en from './en';
import kh from './kh';
import { useLocaleStore, type Locale } from '@/store/locale.store';

const dictionaries: Record<Locale, Record<string, string>> = { en, kh };

type TranslationKey = keyof typeof en;

export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  function t(key: TranslationKey, vars?: Record<string, string | number>): string {
    let str = dictionaries[locale]?.[key] ?? dictionaries.en[key] ?? key;
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        str = str.replace(`{${name}}`, String(value));
      }
    }
    return str;
  }

  return { t, locale, setLocale };
}

export type { Locale };
