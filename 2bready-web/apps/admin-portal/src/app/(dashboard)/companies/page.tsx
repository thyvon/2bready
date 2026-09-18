'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlineOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import SearchIcon from '@mui/icons-material/SearchOutlined';
import FilterListIcon from '@mui/icons-material/FilterListOutlined';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { DataTable, ConfirmDialog, type Column } from '@2bready/ui-core';
import StatusBadge from '@/components/ui/StatusBadge';
import FormSelect from '@/components/forms/FormSelect';
import FormTextField from '@/components/forms/FormTextField';
import CompanyEditDialog from '@/domains/company/components/CompanyEditDialog';
import CompanyCreateDialog from '@/domains/company/components/CompanyCreateDialog';
import { useAuthStore } from '@/store/auth.store';
import { listCompanies, deleteCompany, updateCompany } from '@/domains/company/api';
import { useIndustries } from '@/domains/company/hooks';
import { industryLabel } from '@/domains/company/constants';
import type { Company, CompanyListFilters } from '@/domains/company/types';
import { useToast } from '@/components/feedback/ToastProvider';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function AdminCompaniesPage() {
  const router = useRouter();
  const { hasAnyRole } = useAuthStore();
  const { t, locale } = useTranslation();
  const toast = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<CompanyListFilters>({});
  const { industries } = useIndustries();

  const [pendingDelete, setPendingDelete] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteCompany(pendingDelete.id);
      toast.success(t('admin.company_deleted'));
      setCompanies((prev) => prev.filter((c) => c.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusToggle = async (company: Company) => {
    const nextStatus = company.status === 'active' ? 'suspended' : 'active';
    setStatusUpdatingId(company.id);
    try {
      const updated = await updateCompany(company.id, { status: nextStatus });
      toast.success(t('company.update_success'));
      setCompanies((prev) => prev.map((c) => (c.id === company.id ? updated : c)));
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const columns: Column<Company>[] = [
    { key: 'name', label: t('admin.name_col'), render: (c) => c.name },
    {
      key: 'industry_id',
      label: t('admin.industry_col'),
      render: (c) => {
        const industry = industries.find((i) => i.id === c.industry_id);
        return industry ? industryLabel(industry, locale) : '—';
      },
    },
    { key: 'country_code', label: t('admin.country_col') },
    { key: 'employee_count', label: t('admin.employees_col'), render: (c) => (c.employee_count != null ? String(c.employee_count) : '—') },
    { key: 'status', label: t('admin.status_col'), render: (c) => <StatusBadge status={c.status} /> },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (c) => (
        <Box className="flex items-center justify-end gap-1">
          {(c.status === 'active' || c.status === 'suspended') && (
            <IconButton
              size="small"
              color={c.status === 'active' ? 'error' : 'success'}
              disabled={statusUpdatingId === c.id}
              aria-label={c.status === 'active' ? t('company.suspend_company') : t('company.activate_company')}
              onClick={(e) => { e.stopPropagation(); void handleStatusToggle(c); }}
            >
              {c.status === 'active' ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
            </IconButton>
          )}
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditingCompany(c); }} aria-label={t('common.edit')}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setPendingDelete(c); }} aria-label={t('common.delete')}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
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
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
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
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              {t('admin.new_company')}
            </Button>
          }
        />
      </SectionCard>

      <ConfirmDialog
        open={!!pendingDelete}
        title={t('admin.delete_company')}
        description={pendingDelete ? t('admin.delete_company_confirm', { name: pendingDelete.name }) : ''}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />

      {editingCompany && (
        <CompanyEditDialog
          open={!!editingCompany}
          company={editingCompany}
          onClose={() => setEditingCompany(null)}
          onSaved={(updated) => {
            setEditingCompany(null);
            setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          }}
        />
      )}

      <CompanyCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(company) => setCompanies((prev) => [company, ...prev])}
      />
    </>
  );
}
