'use client';

import Box from '@mui/material/Box';
import DashboardIcon from '@mui/icons-material/GridViewOutlined';
import { useTranslation } from '@/lib/i18n';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import EmptyState from '@/components/ui/EmptyState';

// Admin dashboard shell. KPI tiles (companies, revenue, audits, documents)
// land with their backend endpoint — until then this is the post-login
// landing surface instead of bouncing straight into /companies.
export default function AdminDashboardPage() {
  const { t } = useTranslation();

  return (
    <Box>
      <PageHeader title={t('admin.dashboard_title')} />
      <SectionCard title={t('admin.dashboard_title')} subtitle={t('admin.dashboard_subtitle')}>
        <EmptyState
          icon={<DashboardIcon fontSize="inherit" />}
          title={t('admin.dashboard_coming_soon')}
          description={t('admin.dashboard_coming_soon_desc')}
        />
      </SectionCard>
    </Box>
  );
}
