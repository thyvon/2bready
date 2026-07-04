import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import Providers from '@/components/Providers';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: '2bReady — Compliance Readiness Platform',
  description: 'Guided compliance readiness for businesses',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <InitColorSchemeScript defaultMode="system" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
