'use client';

import { useEffect, useState } from 'react';
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
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
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

  const load = async () => {
    setLoading(true);
    try {
      setPackages(await listPackages());
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

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

  const openEdit = (pkg: Package) => {
    setEditing(pkg);
    reset({
      name: pkg.name,
      name_kh: pkg.name_kh ?? '',
      description: pkg.description ?? '',
      price: pkg.price_cents / 100,
      industry_id: pkg.industry_id ?? '',
      journey_level_id: pkg.journey_level_id ?? '',
      billing_period: pkg.billing_period,
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
        price_cents: Math.round(parsed.price * 100),
        industry_id: parsed.industry_id || undefined,
        journey_level_id: parsed.journey_level_id || undefined,
        billing_period: parsed.billing_period,
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
      load();
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
      load();
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
    { key: 'price_cents', label: t('package.price_col'), render: (p) => formatCents(p.price_cents) },
    { key: 'billing_period', label: t('package.billing_period_col'), render: (p) => t(`package.billing_period.${p.billing_period}`) },
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
                <FieldLabel>{t('package.price')}</FieldLabel>
                <FormTextField
                  type="number"
                  placeholder="199.00"
                  fullWidth
                  slotProps={{ htmlInput: { step: '0.01', min: 0 } }}
                  error={!!errors.price}
                  helperText={errors.price?.message}
                  {...register('price')}
                />
              </Box>
              <Box className="flex-1">
                <FieldLabel>{t('package.billing_period_col')}</FieldLabel>
                <Controller
                  name="billing_period"
                  control={control}
                  render={({ field }) => (
                    <FormSelect {...field} fullWidth error={!!errors.billing_period} helperText={errors.billing_period?.message}>
                      <MenuItem value="monthly">{t('package.billing_period.monthly')}</MenuItem>
                      <MenuItem value="yearly">{t('package.billing_period.yearly')}</MenuItem>
                      <MenuItem value="one_time">{t('package.billing_period.one_time')}</MenuItem>
                    </FormSelect>
                  )}
                />
              </Box>
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
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                  label={t('package.is_active')}
                />
              )}
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
