export type Locale = 'en' | 'kh';

export const LOCALE_COOKIE = 'locale';

// Pure and framework-agnostic on purpose: called server-side (RootLayout, via
// next/headers' cookies()) to pick the locale for the very first HTML sent to
// the browser, and client-side (LocaleProvider) to read the same cookie back.
// Whichever locale the server rendered with is what LocaleProvider's initial
// state must also start as, or hydration mismatches.
export function parseLocaleCookie(value: string | null | undefined): Locale {
  return value === 'kh' ? 'kh' : 'en';
}
