'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/SearchOutlined';
import FilterListIcon from '@mui/icons-material/FilterListOutlined';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import FormSelect from '@/components/forms/FormSelect';
import FormTextField from '@/components/forms/FormTextField';
import { useAuthStore } from '@/store/auth.store';
import { listCompanies } from '@/domains/company/api';
import { useIndustries } from '@/domains/company/hooks';
import { industryLabel } from '@/domains/company/constants';
import type { Company, CompanyListFilters } from '@/domains/company/types';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function AdminCompaniesPage() {
  const router = useRouter();
  const { hasAnyRole } = useAuthStore();
  const { t, locale } = useTranslation();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<CompanyListFilters>({});
  const { industries } = useIndustries();

  const columns: Column<Company>[] = [
    { key: 'name', label: t('admin.name_col'), render: (c) => c.name },
    {
      key: 'industry_id',
      label: t('admin.industry_col'),
      // industry_code (the old free-text field) was dropped from CompanyResource —
      // this used to render blank for every row until it was resolved via the
      // real Industry lookup instead.
      render: (c) => {
        const industry = industries.find((i) => i.id === c.industry_id);
        return industry ? industryLabel(industry, locale) : '—';
      },
    },
    { key: 'country_code', label: t('admin.country_col') },
    { key: 'employee_count', label: t('admin.employees_col'), render: (c) => (c.employee_count != null ? String(c.employee_count) : '—') },
    { key: 'status', label: t('admin.status_col'), render: (c) => <StatusBadge status={c.status} /> },
  ];

  useEffect(() => {
    if (!hasAnyRole(['admin', 'staff', 'finance'])) router.replace('/dashboard');
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
        action={
          <Button component={Link} href="/companies/new" variant="contained" startIcon={<AddIcon />}>
            {t('admin.new_company')}
          </Button>
        }
      />

      <SectionCard noPadding>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, p: 2 }}>
          <FormTextField
            label={t('common.search')}
            size="small"
            value={filters.search ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
            sx={{ width: { xs: '100%', sm: 220 } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> } }}
          />
          <FormSelect
            label={t('common.status')}
            size="small"
            value={filters.status ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value || undefined) as CompanyListFilters['status'] }))}
            sx={{ width: { xs: '100%', sm: 160 } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><FilterListIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> } }}
          >
            <MenuItem value="">{t('common.all')}</MenuItem>
            <MenuItem value="active">{t('common.active')}</MenuItem>
            <MenuItem value="suspended">{t('common.suspended')}</MenuItem>
            <MenuItem value="inactive">{t('common.inactive')}</MenuItem>
          </FormSelect>
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
          onRowClick={(c) => router.push(`/companies/${c.id}`)}
          emptyTitle={t('admin.no_companies')}
          emptyDescription={t('admin.get_started')}
          emptyAction={
            <Button component={Link} href="/companies/new" variant="outlined" startIcon={<AddIcon />}>
              {t('admin.new_company')}
            </Button>
          }
        />
      </SectionCard>
    </>
  );
}
