'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import UserAvatar from '@/components/ui/UserAvatar';
import { useAuthStore } from '@/store/auth.store';
import { useTranslation } from '@/lib/i18n';

export default function ProfilePage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return (
    <>
      <PageHeader title={t('settings.profile_title')} />

      <SectionCard>
        <Box className="flex items-center gap-4">
          <UserAvatar name={user.name} size={56} />
          <Box>
            <Typography variant="h6">{user.name}</Typography>
            <Typography variant="body2" color="text.secondary">{user.email}</Typography>
          </Box>
        </Box>

        <Box className="flex items-center justify-between gap-4 mt-6 pt-4" sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">{t('settings.profile_two_factor')}</Typography>
          <Chip
            label={user.totp_enabled ? t('settings.profile_two_factor_on') : t('settings.profile_two_factor_off')}
            color={user.totp_enabled ? 'success' : 'default'}
            size="small"
            variant="outlined"
          />
        </Box>
      </SectionCard>
    </>
  );
}
