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
import FieldLabel from '@/components/forms/FieldLabel';
import FormSelect from '@/components/forms/FormSelect';
import FormTextField from '@/components/forms/FormTextField';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/feedback/ToastProvider';
import { listPackages, createPackage, updatePackage, deletePackage } from '@/domains/package/api';
import type { Package } from '@/domains/package/types';
import { packageFormSchema, packageFormDefaults, type PackageFormInput } from '@/domains/package/schemas';
import { getApiError, formatCents } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function AdminPackagesPage() {
  const router = useRouter();
  const { hasAnyRole } = useAuthStore();
  const toast = useToast();
  const { t } = useTranslation();

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [serverError, setServerError] = useState('');

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
      billing_period: pkg.billing_period,
      is_active: pkg.is_active,
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
        billing_period: parsed.billing_period,
        is_active: parsed.is_active,
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

  const handleDelete = async (pkg: Package) => {
    if (!window.confirm(t('package.confirm_archive', { name: pkg.name }))) return;
    try {
      await deletePackage(pkg.id);
      toast.success(t('package.archive_success'));
      load();
    } catch (err) {
      toast.error(getApiError(err).message);
    }
  };

  const columns: Column<Package>[] = [
    { key: 'name', label: t('package.name_col'), render: (p) => p.name },
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
          <IconButton size="small" onClick={() => handleDelete(p)} aria-label={t('common.delete')}>
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
    </>
  );
}
