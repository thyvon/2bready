'use client';

import Box from '@mui/material/Box';

import { PageHeader } from '@/components/layout/PageHeader';
import { useTranslation } from '@/lib/i18n';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <Box>
      <PageHeader title={t('settings.title')} />
      {children}
    </Box>
  );
}
