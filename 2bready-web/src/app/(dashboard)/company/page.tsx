'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { useTranslation } from '@/lib/i18n';
import { cardGridContainer, cardGridItem } from '@/lib/motion';

export default function CompanyDashboardPage() {
  const { user, hasRole } = useAuthStore();
  const { t } = useTranslation();

  const firstName = user?.name?.split(' ')[0];
  const needsCompany = hasRole('company_owner') && !user?.company_id;

  if (needsCompany) {
    return (
      <>
        <PageHeader
          title={firstName ? t('company.welcome_back', { name: firstName }) : t('company.welcome_back_generic')}
          subtitle={t('company.dashboard_subtitle')}
        />

        <SectionCard title={t('company.no_company_title')} subtitle={t('company.no_company_subtitle')}>
          <Box className="flex justify-end">
            <Button component={Link} href="/company/setup" variant="contained">
              {t('company.register_company')}
            </Button>
          </Box>
        </SectionCard>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={firstName ? t('company.welcome_back', { name: firstName }) : t('company.welcome_back_generic')}
        subtitle={t('company.dashboard_subtitle')}
      />

      <Grid container spacing={3} component={motion.div} initial="hidden" animate="show" variants={cardGridContainer}>
        <Grid size={{ xs: 12, md: 4 }} component={motion.div} variants={cardGridItem}>
          <SectionCard title={t('company.status_card')}>
            <Box className="flex items-center gap-2">
              <StatusBadge status="active" />
              <Typography variant="body2" color="text.secondary">{t('company.account_active')}</Typography>
            </Box>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }} component={motion.div} variants={cardGridItem}>
          <SectionCard title={t('company.compliance_level')}>
            <Box className="flex items-center gap-2">
              <StatusBadge status="pending" label={t('company.not_started')} />
              <Typography variant="body2" color="text.secondary">{t('company.begin_journey')}</Typography>
            </Box>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }} component={motion.div} variants={cardGridItem}>
          <SectionCard title={t('nav.subscription')}>
            <Box className="flex items-center gap-2">
              <StatusBadge status="pending" label={t('company.no_plan')} />
              <Typography variant="body2" color="text.secondary">{t('company.choose_package')}</Typography>
            </Box>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12 }} component={motion.div} variants={cardGridItem}>
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
