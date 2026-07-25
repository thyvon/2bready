'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import theme from '@/theme';
import LocaleProvider from '@/components/LocaleProvider';
import { ToastProvider } from '@/components/ToastProvider';
import type { Locale } from '@/store/locale.store';

export default function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  return (
    <LocaleProvider initialLocale={initialLocale}>
      <AppRouterCacheProvider>
        <ThemeProvider theme={theme} defaultMode="system">
          <CssBaseline />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <ToastProvider>{children}</ToastProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </AppRouterCacheProvider>
    </LocaleProvider>
  );
}
