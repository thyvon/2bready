'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LOCALE_COOKIE, parseLocaleCookie, type Locale } from '@/store/locale.store';

// The pre-cookie version of this feature stored the preference under this
// localStorage key via zustand's persist middleware. One-time migration below
// so anyone who already picked Khmer doesn't silently fall back to English
// once the cookie becomes the source of truth.
const LEGACY_STORAGE_KEY = '2bready-locale';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function writeCookie(locale: Locale) {
  // 1 year, matches how long a language preference should reasonably stick.
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

// `initialLocale` comes from RootLayout (a Server Component) reading the
// locale cookie per-request via next/headers — so the very first HTML the
// browser paints already uses the right language, no flash. useState here is
// component-local, not a module-level singleton, so this is safe under
// concurrent requests: each request gets its own React tree and its own
// initial value from its own props, never a shared mutable store.
export default function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    if (document.cookie.includes(`${LOCALE_COOKIE}=`)) return;
    let legacy: Locale | null = null;
    try {
      const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      legacy = raw ? parseLocaleCookie(JSON.parse(raw)?.state?.locale) : null;
    } catch {
      legacy = null;
    }
    if (legacy !== 'kh') return;
    // Deferred a tick so this reads as "reacting to an external read," not a
    // synchronous setState-in-effect — same shape as the auth store's
    // hydration-flag fix elsewhere in this codebase.
    queueMicrotask(() => {
      writeCookie('kh');
      setLocaleState('kh');
    });
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: (next) => {
        writeCookie(next);
        setLocaleState(next);
      },
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
