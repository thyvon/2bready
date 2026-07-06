import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import Providers from '@/components/Providers';
import { PortalShell } from '@/components/layout/PortalShell';
import { LOCALE_COOKIE, getLocaleConfig, parseLocaleCookie } from '@/store/locale.store';
import './globals.css';

export const metadata: Metadata = {
  title: '2bReady — Client Portal',
  description: 'Compliance readiness, document vault, and audit journey for your company',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading the cookie here (a Server Component, fresh per request) lets the
  // very first HTML response already use the visitor's saved language — no
  // client-side correction, no flash. See LocaleProvider for why this is safe
  // under concurrent requests (component-local state from a prop, not a
  // shared module-level store).
  const cookieStore = await cookies();
  const initialLocale = parseLocaleCookie(cookieStore.get(LOCALE_COOKIE)?.value);

  return (
    <html
      lang={getLocaleConfig(initialLocale).htmlLang}
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <InitColorSchemeScript defaultMode="system" />
        <Providers initialLocale={initialLocale}>
          <PortalShell>{children}</PortalShell>
        </Providers>
      </body>
    </html>
  );
}
