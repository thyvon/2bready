import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import Providers from '@/components/Providers';
import { PortalShell } from '@/components/layout/PortalShell';
import './globals.css';

export const metadata: Metadata = {
  title: '2bReady — Client Portal',
  description: 'Compliance readiness, document vault, and audit journey for your company',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <InitColorSchemeScript defaultMode="system" />
        <Providers>
          <PortalShell>{children}</PortalShell>
        </Providers>
      </body>
    </html>
  );
}
