'use client';

import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import EmptyState from '@/components/ui/EmptyState';
import { useTranslation } from '@/lib/i18n';

// Placeholder — the company-list content that used to live here moved to
// its own /companies page (mirrors admin-portal's Companies list). This
// route is reserved for a future analytics view, not built yet.
export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader title={t('tp.dashboard_title')} />

      <SectionCard>
        <EmptyState
          icon={<InsertChartOutlinedIcon fontSize="inherit" />}
          title={t('tp.dashboard_coming_soon_title')}
          description={t('tp.dashboard_coming_soon_desc')}
        />
      </SectionCard>
    </>
  );
}
