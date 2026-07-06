'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { LOCALE_COOKIE, type Locale } from '@/store/locale.store';

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
