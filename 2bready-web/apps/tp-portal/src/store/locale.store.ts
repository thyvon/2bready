export interface LocaleConfig {
  code: string;
  /** BCP-47 tag for the <html lang> attribute — not always identical to
   *  `code` (Khmer's cookie/dictionary key is 'kh', but the correct IETF tag
   *  is 'km'). */
  htmlLang: string;
  /** Shown in the language switcher badge when no color-emoji flag font is
   *  available (see LanguageSwitcher — flag ligatures render as bare letters
   *  on many Linux setups, so a plain badge is used instead everywhere). */
  badge: string;
  label: string;
}

// Single source of truth for every supported locale. Add a language by adding
// one entry here plus its dictionary file (en.ts/kh.ts) — not by touching a
// ternary/map in each of layout.tsx, LanguageSwitcher, and parseLocaleCookie
// individually, which is how this used to be wired and doesn't scale past 2
// languages.
export const LOCALES = [
  { code: 'en', htmlLang: 'en', badge: 'EN', label: 'English' },
  { code: 'kh', htmlLang: 'km', badge: 'KH', label: 'ខ្មែរ' },
] as const satisfies readonly LocaleConfig[];

export type Locale = (typeof LOCALES)[number]['code'];

export const LOCALE_COOKIE = 'locale';

const DEFAULT_LOCALE: Locale = 'en';

// Pure and framework-agnostic on purpose: called server-side (RootLayout, via
// next/headers' cookies()) to pick the locale for the very first HTML sent to
// the browser, and client-side (LocaleProvider) to read the same cookie back.
// Whichever locale the server rendered with is what LocaleProvider's initial
// state must also start as, or hydration mismatches.
export function parseLocaleCookie(value: string | null | undefined): Locale {
  return LOCALES.find((l) => l.code === value)?.code ?? DEFAULT_LOCALE;
}

export function getLocaleConfig(locale: Locale): LocaleConfig {
  return LOCALES.find((l) => l.code === locale) ?? LOCALES[0];
}
