'use client';

import Box from '@mui/material/Box';

import { SectionCard } from '@2bready/ui-core';
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';

export default function NotificationsPage() {
  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }}>
      <SectionCard>
        <NotificationPreferences />
      </SectionCard>
    </Box>
  );
}
