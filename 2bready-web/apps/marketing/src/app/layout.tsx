import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Kantumruy_Pro } from 'next/font/google';
import { MotionConfig } from 'framer-motion';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import Providers from '@/components/Providers';
import MarketingHeader from '@/components/layouts/MarketingHeader';
import MarketingFooter from '@/components/layouts/MarketingFooter';
import './globals.css';

// Marketing is English-only today (see feedback_always_translate_new_ui /
// project i18n rollout notes — it's intentionally left untranslated), but the
// font stack is kept consistent with admin/client-portal in case that changes.
// Geist has no Khmer glyphs — Kantumruy Pro fills that gap via automatic
// per-character font-family fallback, no locale-conditional logic needed.
const kantumruyPro = Kantumruy_Pro({
  variable: '--font-kantumruy',
  subsets: ['khmer', 'latin'],
});

export const metadata: Metadata = {
  title: '2bReady — Compliance Readiness Platform',
  description: 'Guided compliance readiness for businesses',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${kantumruyPro.variable}`} suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <InitColorSchemeScript defaultMode="system" />
        <Providers>
          <MotionConfig reducedMotion="user">
            <MarketingHeader />
            <main>{children}</main>
            <MarketingFooter />
          </MotionConfig>
        </Providers>
      </body>
    </html>
  );
}
