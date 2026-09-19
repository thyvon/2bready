'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SectionCard } from '@2bready/ui-core';
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';
import { useTranslation } from '@/lib/i18n';

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', py: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
        {t('settings.title') ?? 'Settings'}
      </Typography>

      <SectionCard sx={{ mt: 3 }}>
        <NotificationPreferences />
      </SectionCard>
    </Box>
  );
}
