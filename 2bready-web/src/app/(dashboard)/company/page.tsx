'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { useTranslation } from '@/lib/i18n';

export default function CompanyDashboardPage() {
  const router = useRouter();
  const { user, hasRole } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (hasRole('company_owner') && !user?.company_id) {
      router.replace('/company/setup');
    }
  }, [hasRole, user, router]);

  if (hasRole('company_owner') && !user?.company_id) return null;

  const firstName = user?.name?.split(' ')[0];

  return (
    <>
      <PageHeader
        title={firstName ? t('company.welcome_back', { name: firstName }) : t('company.welcome_back_generic')}
        subtitle={t('company.dashboard_subtitle')}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard title={t('company.status_card')}>
            <Box className="flex items-center gap-2">
              <StatusBadge status="active" />
              <Typography variant="body2" color="text.secondary">{t('company.account_active')}</Typography>
            </Box>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard title={t('company.compliance_level')}>
            <Box className="flex items-center gap-2">
              <StatusBadge status="pending" label={t('company.not_started')} />
              <Typography variant="body2" color="text.secondary">{t('company.begin_journey')}</Typography>
            </Box>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard title={t('nav.subscription')}>
            <Box className="flex items-center gap-2">
              <StatusBadge status="pending" label={t('company.no_plan')} />
              <Typography variant="body2" color="text.secondary">{t('company.choose_package')}</Typography>
            </Box>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <SectionCard title={t('company.recent_activity')} subtitle={t('company.recent_activity_desc')}>
            <Box className="py-8 text-center">
              <Typography variant="body2" color="text.secondary">{t('company.no_activity')}</Typography>
            </Box>
          </SectionCard>
        </Grid>
      </Grid>
    </>
  );
}
