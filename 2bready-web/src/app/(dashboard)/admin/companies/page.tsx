'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/Add';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/store/auth.store';
import { listCompanies } from '@/domains/company/api';
import type { Company, CompanyListFilters } from '@/domains/company/types';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function AdminCompaniesPage() {
  const router = useRouter();
  const { hasAnyRole } = useAuthStore();
  const { t } = useTranslation();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<CompanyListFilters>({});

  const columns: Column<Company>[] = [
    { key: 'name', label: t('admin.name_col'), render: (c) => c.name },
    { key: 'industry_code', label: t('admin.industry_col') },
    { key: 'country_code', label: t('admin.country_col') },
    { key: 'employee_count', label: t('admin.employees_col'), render: (c) => (c.employee_count != null ? String(c.employee_count) : '—') },
    { key: 'status', label: t('admin.status_col'), render: (c) => <StatusBadge status={c.status} /> },
  ];

  useEffect(() => {
    if (!hasAnyRole(['admin', 'staff', 'finance'])) router.replace('/company');
  }, [hasAnyRole, router]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError('');
      try {
        const { companies } = await listCompanies(filters);
        if (!cancelled) setCompanies(companies);
      } catch (err) {
        if (!cancelled) setError(getApiError(err).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [filters]);

  return (
    <>
      <PageHeader
        title={t('admin.companies_title')}
        subtitle={t('admin.companies_subtitle')}
        action={
          <Button component={Link} href="/admin/companies/new" variant="contained" startIcon={<AddIcon />}>
            {t('admin.new_company')}
          </Button>
        }
      />

      <SectionCard noPadding>
        <Box className="flex gap-3 p-4">
          <TextField
            label={t('common.search')}
            size="small"
            value={filters.search ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
            sx={{ minWidth: 220 }}
          />
          <TextField
            select
            label={t('common.status')}
            size="small"
            value={filters.status ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value || undefined) as CompanyListFilters['status'] }))}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">{t('common.all')}</MenuItem>
            <MenuItem value="active">{t('common.active')}</MenuItem>
            <MenuItem value="suspended">{t('common.suspended')}</MenuItem>
            <MenuItem value="inactive">{t('common.inactive')}</MenuItem>
          </TextField>
        </Box>

        {error && (
          <Box className="px-4 pb-4">
            <Box className="text-sm" sx={{ color: 'error.main' }}>{error}</Box>
          </Box>
        )}

        <DataTable
          columns={columns}
          rows={companies}
          getRowId={(c) => c.id}
          loading={loading}
          emptyTitle={t('admin.no_companies')}
          emptyDescription={t('admin.get_started')}
          emptyAction={
            <Button component={Link} href="/admin/companies/new" variant="outlined" startIcon={<AddIcon />}>
              {t('admin.new_company')}
            </Button>
          }
        />
      </SectionCard>
    </>
  );
}
