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
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FieldLabel from '@/components/forms/FieldLabel';
import FormSelect from '@/components/forms/FormSelect';
import FormTextField from '@/components/forms/FormTextField';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/feedback/ToastProvider';
import { useJourneyTemplates } from '@/domains/journey-template/hooks';
import { createJourneyTemplate, updateJourneyTemplate, deleteJourneyTemplate } from '@/domains/journey-template/api';
import type { JourneyTemplate } from '@/domains/journey-template/types';
import {
  journeyTemplateFormSchema,
  journeyTemplateFormDefaults,
  type JourneyTemplateFormInput,
} from '@/domains/journey-template/schemas';
import { useIndustries } from '@/domains/company/hooks';
import { industryLabel, COUNTRY_OPTIONS } from '@/domains/company/constants';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function JourneyTemplatesPage() {
  const router = useRouter();
  const { hasAnyRole } = useAuthStore();
  const toast = useToast();
  const { t, locale } = useTranslation();
  const { industries } = useIndustries();
  const { journeyTemplates, loading, reload } = useJourneyTemplates();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<JourneyTemplate | null>(null);
  const [serverError, setServerError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<JourneyTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!hasAnyRole(['admin', 'staff'])) router.replace('/dashboard');
  }, [hasAnyRole, router]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JourneyTemplateFormInput>({
    resolver: zodResolver(journeyTemplateFormSchema),
    defaultValues: journeyTemplateFormDefaults,
  });

  const openCreate = () => {
    setEditing(null);
    reset(journeyTemplateFormDefaults);
    setServerError('');
    setDialogOpen(true);
  };

  const openEdit = (template: JourneyTemplate) => {
    setEditing(template);
    reset({
      country_code: template.country_code,
      industry_id: template.industry_id,
      name: template.name,
      name_kh: template.name_kh ?? '',
      is_active: template.is_active,
    });
    setServerError('');
    setDialogOpen(true);
  };

  const onSubmit = async (data: JourneyTemplateFormInput) => {
    setServerError('');
    try {
      const parsed = journeyTemplateFormSchema.parse(data);
      const payload = {
        country_code: parsed.country_code,
        industry_id: parsed.industry_id,
        name: parsed.name,
        name_kh: parsed.name_kh || undefined,
        is_active: parsed.is_active,
      };

      if (editing) {
        await updateJourneyTemplate(editing.id, payload);
      } else {
        await createJourneyTemplate(payload);
      }

      toast.success(editing ? t('journey_template.update_success') : t('journey_template.create_success'));
      setDialogOpen(false);
      reload();
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteJourneyTemplate(pendingDelete.id);
      toast.success(t('journey_template.delete_success'));
      setPendingDelete(null);
      reload();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<JourneyTemplate>[] = [
    { key: 'name', label: t('journey_template.name_col'), render: (jt) => jt.name },
    { key: 'country_code', label: t('journey_template.country_col'), render: (jt) => jt.country_code },
    {
      key: 'industry_id',
      label: t('journey_template.industry_col'),
      render: (jt) => {
        const industry = industries.find((i) => i.id === jt.industry_id);
        return industry ? industryLabel(industry, locale) : jt.industry_code || '—';
      },
    },
    { key: 'is_active', label: t('common.status'), render: (jt) => <StatusBadge status={jt.is_active ? 'active' : 'inactive'} /> },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (jt) => (
        <Box className="flex justify-end gap-1">
          <IconButton
            size="small"
            onClick={() => router.push(`/journey-templates/${jt.id}`)}
            aria-label={t('journey_template.manage_taxonomy')}
          >
            <AccountTreeOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => openEdit(jt)} aria-label={t('common.edit')}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => setPendingDelete(jt)} aria-label={t('common.delete')}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('journey_template.title')}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            {t('journey_template.new_template')}
          </Button>
        }
      />

      <SectionCard noPadding>
        <DataTable
          columns={columns}
          rows={journeyTemplates}
          getRowId={(jt) => jt.id}
          loading={loading}
          emptyTitle={t('journey_template.no_templates')}
          emptyDescription={t('journey_template.get_started')}
          onRowClick={(jt) => router.push(`/journey-templates/${jt.id}`)}
        />
      </SectionCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogTitle>{editing ? t('journey_template.edit_template') : t('journey_template.new_template')}</DialogTitle>
          <DialogContent className="flex flex-col gap-5" sx={{ pt: '8px !important' }}>
            {serverError && <Box sx={{ color: 'error.main', fontSize: '0.875rem' }}>{serverError}</Box>}

            <Box>
              <FieldLabel>{t('journey_template.name')}</FieldLabel>
              <FormTextField
                placeholder="e.g. Cambodia F&B Journey"
                fullWidth
                autoFocus
                error={!!errors.name}
                helperText={errors.name?.message}
                {...register('name')}
              />
            </Box>

            <Box>
              <FieldLabel>{t('journey_template.name_kh')}</FieldLabel>
              <FormTextField fullWidth error={!!errors.name_kh} helperText={errors.name_kh?.message} {...register('name_kh')} />
            </Box>

            <Box className="flex gap-4">
              <Box className="flex-1">
                <FieldLabel>{t('journey_template.country_col')}</FieldLabel>
                <Controller
                  name="country_code"
                  control={control}
                  render={({ field }) => (
                    <FormSelect {...field} fullWidth error={!!errors.country_code} helperText={errors.country_code?.message}>
                      {COUNTRY_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {t(opt.labelKey)}
                        </MenuItem>
                      ))}
                    </FormSelect>
                  )}
                />
              </Box>
              <Box className="flex-1">
                <FieldLabel>{t('journey_template.industry_col')}</FieldLabel>
                <Controller
                  name="industry_id"
                  control={control}
                  render={({ field }) => (
                    <FormSelect {...field} fullWidth error={!!errors.industry_id} helperText={errors.industry_id?.message}>
                      {industries.map((industry) => (
                        <MenuItem key={industry.id} value={industry.id}>
                          {industryLabel(industry, locale)}
                        </MenuItem>
                      ))}
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
                  label={t('journey_template.is_active')}
                />
              )}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button variant="text" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="contained" loading={isSubmitting}>
              {t('common.save')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDelete}
        title={t('journey_template.confirm_delete_title')}
        description={t('journey_template.confirm_delete_desc', { name: pendingDelete?.name ?? '' })}
        confirmLabel={t('common.delete')}
        danger
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
