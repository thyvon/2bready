import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Plus_Jakarta_Sans, Kantumruy_Pro } from 'next/font/google';
import { MotionConfig } from 'framer-motion';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import Providers from '@/components/Providers';
import './globals.css';

// Marketing is English-only today (see feedback_always_translate_new_ui /
// project i18n rollout notes — it's intentionally left untranslated), but the
// font stack is kept consistent with admin/client-portal in case that changes.
// The 2bReady marketing site follows the MAXX reference design: Plus Jakarta
// Sans drives display/headings; Geist handles body/UI text. Geist has no Khmer
// glyphs — Kantumruy Pro fills that gap via automatic per-character font-family
// fallback, no locale-conditional logic needed.
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  display: 'swap',
});

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
    <html lang="en" className={`${plusJakartaSans.variable} ${GeistSans.variable} ${GeistMono.variable} ${kantumruyPro.variable}`} suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <InitColorSchemeScript defaultMode="system" />
        <Providers>
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </Providers>
      </body>
    </html>
  );
}
