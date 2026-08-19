'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@2bready/ui-core';
import FieldLabel from '@/components/forms/FieldLabel';
import FormSelect from '@/components/forms/FormSelect';
import FormTextField from '@/components/forms/FormTextField';
import FormSwitch from '@/components/forms/FormSwitch';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/feedback/ToastProvider';
import { listPackages, createPackage, updatePackage, deletePackage } from '@/domains/package/api';
import { useJourneyLevels } from '@/domains/package/hooks';
import type { Package } from '@/domains/package/types';
import { packageFormSchema, packageFormDefaults, type PackageFormInput } from '@/domains/package/schemas';
import { useIndustries } from '@/domains/company/hooks';
import { industryLabel } from '@/domains/company/constants';
import { getApiError, formatCents } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function AdminPackagesPage() {
  const router = useRouter();
  const { hasAnyRole } = useAuthStore();
  const toast = useToast();
  const { t, locale } = useTranslation();
  const { industries } = useIndustries();
  const { journeyLevels } = useJourneyLevels();

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [serverError, setServerError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Package | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!hasAnyRole(['admin', 'staff', 'finance'])) router.replace('/dashboard');
  }, [hasAnyRole, router]);

  // Silent in-place refetch for after a create/edit/delete — updates the
  // table without flipping `loading`, so no spinner flash or scroll jump.
  const refetch = useCallback(() => {
    void listPackages()
      .then(setPackages)
      .catch((err) => toast.error(getApiError(err).message));
  }, [toast]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const data = await listPackages();
        if (!cancelled) setPackages(data);
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

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PackageFormInput>({ resolver: zodResolver(packageFormSchema), defaultValues: packageFormDefaults });

  const openCreate = () => {
    setEditing(null);
    reset(packageFormDefaults);
    setServerError('');
    setDialogOpen(true);
  };

  const priceFor = (pkg: Package, period: 'monthly' | 'yearly') => {
    const price = (pkg.prices ?? []).find((p) => p.billing_period === period);
    return price?.price_cents ?? null;
  };

  const openEdit = (pkg: Package) => {
    setEditing(pkg);
    reset({
      name: pkg.name,
      name_kh: pkg.name_kh ?? '',
      description: pkg.description ?? '',
      monthly_price: (priceFor(pkg, 'monthly') ?? 0) / 100,
      yearly_price: (priceFor(pkg, 'yearly') ?? 0) / 100,
      audit_fee: Number(pkg.audit_fee_cents ?? 0) / 100,
      industry_id: pkg.industry_id ?? '',
      journey_level_id: pkg.journey_level_id ?? '',
      tier: pkg.tier,
      is_active: pkg.is_active,
      sort_order: pkg.sort_order,
    });
    setServerError('');
    setDialogOpen(true);
  };

  const onSubmit = async (data: PackageFormInput) => {
    setServerError('');
    try {
      const parsed = packageFormSchema.parse(data);
      const payload = {
        name: parsed.name,
        name_kh: parsed.name_kh || undefined,
        description: parsed.description || undefined,
        monthly_price_cents: Math.round(parsed.monthly_price * 100),
        yearly_price_cents: Math.round(parsed.yearly_price * 100),
        audit_fee_cents: Math.round(parsed.audit_fee * 100),
        industry_id: parsed.industry_id || undefined,
        journey_level_id: parsed.journey_level_id || undefined,
        tier: parsed.tier,
        is_active: parsed.is_active,
        sort_order: parsed.sort_order,
      };

      if (editing) {
        await updatePackage(editing.id, payload);
      } else {
        await createPackage(payload);
      }

      toast.success(editing ? t('package.update_success') : t('package.create_success'));
      setDialogOpen(false);
      refetch();
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deletePackage(pendingDelete.id);
      toast.success(t('package.archive_success'));
      setPendingDelete(null);
      refetch();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Package>[] = [
    { key: 'name', label: t('package.name_col'), render: (p) => p.name },
    {
      key: 'industry_id',
      label: t('package.industry_col'),
      render: (p) => {
        const industry = industries.find((i) => i.id === p.industry_id);
        return industry ? industryLabel(industry, locale) : t('package.all_industries');
      },
    },
    { key: 'tier', label: t('package.tier_col'), render: (p) => t(`package.tier.${p.tier}`) },
    {
      key: 'prices',
      label: t('package.price_col'),
      render: (p) => {
        const monthly = priceFor(p, 'monthly');
        const yearly = priceFor(p, 'yearly');
        return (
          <span className="text-sm">
            {monthly !== null && <span>{formatCents(monthly)}{t('package.per_month')}</span>}
            {monthly !== null && yearly !== null && <span className="mx-1.5 text-gray-400">·</span>}
            {yearly !== null && <span>{formatCents(yearly)}{t('package.per_year')}</span>}
            {monthly === null && yearly === null && <span className="text-gray-400">—</span>}
          </span>
        );
      },
    },
    { key: 'is_active', label: t('common.status'), render: (p) => <StatusBadge status={p.is_active ? 'active' : 'inactive'} /> },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (p) => (
        <Box className="flex justify-end gap-1">
          <IconButton size="small" onClick={() => openEdit(p)} aria-label={t('common.edit')}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => setPendingDelete(p)} aria-label={t('common.delete')}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('package.title')}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            {t('package.new_package')}
          </Button>
        }
      />

      <SectionCard noPadding>
        <DataTable
          columns={columns}
          rows={packages}
          getRowId={(p) => p.id}
          loading={loading}
          emptyTitle={t('package.no_packages')}
          emptyDescription={t('package.get_started')}
        />
      </SectionCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogTitle>{editing ? t('package.edit_package') : t('package.new_package')}</DialogTitle>
          <DialogContent className="flex flex-col gap-5" sx={{ pt: '8px !important' }}>
            {serverError && <Box sx={{ color: 'error.main', fontSize: '0.875rem' }}>{serverError}</Box>}

            <Box>
              <FieldLabel>{t('package.name')}</FieldLabel>
              <FormTextField
                placeholder="e.g. Growth"
                fullWidth
                autoFocus
                error={!!errors.name}
                helperText={errors.name?.message}
                {...register('name')}
              />
            </Box>

            <Box>
              <FieldLabel>{t('package.name_kh')}</FieldLabel>
              <FormTextField placeholder="ឈ្មោះកញ្ចប់" fullWidth error={!!errors.name_kh} helperText={errors.name_kh?.message} {...register('name_kh')} />
            </Box>

            <Box>
              <FieldLabel>{t('package.description')}</FieldLabel>
              <FormTextField
                placeholder={t('package.description_placeholder')}
                fullWidth
                multiline
                rows={2}
                error={!!errors.description}
                helperText={errors.description?.message}
                {...register('description')}
              />
            </Box>

            <Box className="flex gap-4">
              <Box className="flex-1">
                <FieldLabel>{t('package.monthly_price')}</FieldLabel>
                <FormTextField
                  type="number"
                  placeholder="19.90"
                  fullWidth
                  slotProps={{ htmlInput: { step: '0.01', min: 0 } }}
                  error={!!errors.monthly_price}
                  helperText={errors.monthly_price?.message}
                  {...register('monthly_price')}
                />
              </Box>
              <Box className="flex-1">
                <FieldLabel>{t('package.yearly_price')}</FieldLabel>
                <FormTextField
                  type="number"
                  placeholder="199.00"
                  fullWidth
                  slotProps={{ htmlInput: { step: '0.01', min: 0 } }}
                  error={!!errors.yearly_price}
                  helperText={errors.yearly_price?.message}
                  {...register('yearly_price')}
                />
              </Box>
            </Box>

            <Box>
              <FieldLabel>{t('package.audit_fee')}</FieldLabel>
              <FormTextField
                type="number"
                placeholder="25.00"
                fullWidth
                slotProps={{ htmlInput: { step: '0.01', min: 0 } }}
                error={!!errors.audit_fee}
                helperText={errors.audit_fee?.message}
                {...register('audit_fee')}
              />
            </Box>

            <Box className="flex gap-4">
              <Box className="flex-1">
                <FieldLabel>{t('package.industry_col')}</FieldLabel>
                <Controller
                  name="industry_id"
                  control={control}
                  render={({ field }) => (
                    <FormSelect {...field} fullWidth error={!!errors.industry_id} helperText={errors.industry_id?.message}>
                      <MenuItem value="">{t('package.all_industries')}</MenuItem>
                      {industries.map((industry) => (
                        <MenuItem key={industry.id} value={industry.id}>{industryLabel(industry, locale)}</MenuItem>
                      ))}
                    </FormSelect>
                  )}
                />
              </Box>
              <Box className="flex-1">
                <FieldLabel>{t('package.journey_level_col')}</FieldLabel>
                <Controller
                  name="journey_level_id"
                  control={control}
                  render={({ field }) => (
                    <FormSelect {...field} fullWidth error={!!errors.journey_level_id} helperText={errors.journey_level_id?.message}>
                      <MenuItem value="">{t('package.no_journey_level')}</MenuItem>
                      {journeyLevels.map((level) => (
                        <MenuItem key={level.id} value={level.id}>{level.code} — {level.name}</MenuItem>
                      ))}
                    </FormSelect>
                  )}
                />
              </Box>
            </Box>

            <Box className="flex gap-4">
              <Box className="flex-1">
                <FieldLabel>{t('package.tier_col')}</FieldLabel>
                <Controller
                  name="tier"
                  control={control}
                  render={({ field }) => (
                    <FormSelect {...field} fullWidth error={!!errors.tier} helperText={errors.tier?.message}>
                      <MenuItem value="free">{t('package.tier.free')}</MenuItem>
                      <MenuItem value="starter">{t('package.tier.starter')}</MenuItem>
                      <MenuItem value="pro">{t('package.tier.pro')}</MenuItem>
                      <MenuItem value="enterprise">{t('package.tier.enterprise')}</MenuItem>
                    </FormSelect>
                  )}
                />
              </Box>
              <Box className="flex-1">
                <FieldLabel>{t('package.sort_order')}</FieldLabel>
                <FormTextField
                  type="number"
                  fullWidth
                  slotProps={{ htmlInput: { step: '1', min: 0 } }}
                  error={!!errors.sort_order}
                  helperText={errors.sort_order?.message}
                  {...register('sort_order')}
                />
              </Box>
            </Box>

            <Controller
              name="is_active"
              control={control}
              render={({ field }) => <FormSwitch checked={field.value} onChange={field.onChange} label={t('package.is_active')} />}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button variant="text" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" loading={isSubmitting}>{t('common.save')}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDelete}
        title={t('package.confirm_archive_title')}
        description={pendingDelete ? t('package.confirm_archive', { name: pendingDelete.name }) : ''}
        confirmLabel={t('common.delete')}
        danger
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
