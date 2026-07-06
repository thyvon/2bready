import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Kantumruy_Pro } from 'next/font/google';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import Providers from '@/components/Providers';
import { LOCALE_COOKIE, getLocaleConfig, parseLocaleCookie } from '@/store/locale.store';
import './globals.css';

// Geist has no Khmer glyphs — Kantumruy Pro fills that gap. Both variables
// sit in the same font-family stack (theme/index.ts); the browser
// automatically falls through to Kantumruy Pro per-character for any glyph
// Geist can't render, so Latin text still renders in Geist and Khmer text
// renders in Kantumruy Pro without any locale-conditional logic.
const kantumruyPro = Kantumruy_Pro({
  variable: '--font-kantumruy',
  subsets: ['khmer', 'latin'],
});

export const metadata: Metadata = {
  title: '2bReady — Compliance Readiness Platform',
  description: 'Guided compliance readiness for businesses',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading the cookie here (a Server Component, fresh per request) lets the
  // very first HTML response already use the visitor's saved language —
  // no client-side correction, no flash. See LocaleProvider for why this is
  // safe under concurrent requests (component-local state from a prop, not a
  // shared module-level store).
  const cookieStore = await cookies();
  const initialLocale = parseLocaleCookie(cookieStore.get(LOCALE_COOKIE)?.value);

  return (
    <html
      lang={getLocaleConfig(initialLocale).htmlLang}
      className={`${GeistSans.variable} ${GeistMono.variable} ${kantumruyPro.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <InitColorSchemeScript defaultMode="system" />
        <Providers initialLocale={initialLocale}>{children}</Providers>
      </body>
    </html>
  );
}
