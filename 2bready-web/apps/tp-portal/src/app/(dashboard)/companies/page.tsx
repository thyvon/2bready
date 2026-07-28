'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { listMyCompanies } from '@/domains/hires/api';
import type { CompanyWithHiredLevels } from '@/domains/hires/types';
import { useToast } from '@/components/feedback/ToastProvider';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function CompaniesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const toast = useToast();
  const [companies, setCompanies] = useState<CompanyWithHiredLevels[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const data = await listMyCompanies();
        if (!cancelled) setCompanies(data);
      } catch (err) {
        if (!cancelled) toast.error(getApiError(err).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: Column<CompanyWithHiredLevels>[] = [
    { key: 'name', label: t('tp.company_name_col'), render: (c) => c.name },
    { key: 'country_code', label: t('tp.country_col') },
    {
      key: 'hired_levels',
      label: t('tp.hired_levels_col'),
      render: (c) => (
        <Box className="flex gap-1">
          {c.hired_levels.map((level) => (
            <Chip key={level} label={level} size="small" variant="outlined" />
          ))}
        </Box>
      ),
    },
  ];

  return (
    <>
      <PageHeader title={t('tp.companies_title')} />

      <SectionCard noPadding>
        <DataTable
          columns={columns}
          rows={companies}
          getRowId={(c) => c.id}
          loading={loading}
          onRowClick={(c) => router.push(`/companies/${c.id}`)}
          emptyTitle={t('tp.no_companies')}
          emptyDescription={t('tp.no_companies_desc')}
        />
      </SectionCard>
    </>
  );
}
