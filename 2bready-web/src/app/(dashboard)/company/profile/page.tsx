'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/feedback/ToastProvider';
import { getCompany, updateCompany } from '@/domains/company/api';
import type { Company } from '@/domains/company/types';
import { companyFormSchema, type CompanyFormInput } from '@/domains/company/schemas';
import { INDUSTRY_OPTIONS, COUNTRY_OPTIONS, LOCALE_OPTIONS } from '@/domains/company/constants';
import { getApiError, formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import FieldLabel from '@/components/forms/FieldLabel';

export default function CompanyProfilePage() {
  const router = useRouter();
  const { user, hasRole } = useAuthStore();
  const toast = useToast();
  const { t } = useTranslation();
  const canEdit = hasRole('company_owner');

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [serverError, setServerError] = useState('');

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormInput>({ resolver: zodResolver(companyFormSchema) });

  useEffect(() => {
    if (!user?.company_id) {
      router.replace(hasRole('company_owner') ? '/company/setup' : '/company');
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        const data = await getCompany(user!.company_id!);
        if (cancelled) return;
        setCompany(data);
        reset({
          name: data.name,
          name_kh: data.name_kh ?? '',
          registration_no: data.registration_no ?? '',
          industry_code: data.industry_code,
          country_code: data.country_code,
          employee_count: data.employee_count ?? undefined,
          default_locale: data.default_locale as 'en' | 'kh',
        });
      } catch (err) {
        if (!cancelled) setLoadError(getApiError(err).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user, hasRole, router, reset]);

  const onSubmit = async (data: CompanyFormInput) => {
    if (!company) return;
    setServerError('');
    try {
      const parsed = companyFormSchema.parse(data);
      const updated = await updateCompany(company.id, {
        name: parsed.name,
        name_kh: parsed.name_kh || undefined,
        registration_no: parsed.registration_no || undefined,
        industry_code: parsed.industry_code,
        country_code: parsed.country_code,
        employee_count: parsed.employee_count,
        default_locale: parsed.default_locale,
      });
      setCompany(updated);
      toast.success(t('company.update_success'));
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  if (loading) {
    return (
      <Box className="flex justify-center py-16">
        <CircularProgress />
      </Box>
    );
  }

  if (loadError || !company) {
    return (
      <>
        <PageHeader title={t('company.profile_title')} />
        <Alert severity="error">{loadError || t('company.not_found')}</Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader title={company.name} subtitle={t('company.profile_subtitle')} />

      <Box className="flex flex-col gap-4">
        <SectionCard title={t('company.overview')}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">{t('common.status')}</Typography>
              <Box className="mt-1"><StatusBadge status={company.status} /></Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">{t('company.compliance_score')}</Typography>
              <Typography variant="body2">{company.compliance_score}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">{t('company.registered_on')}</Typography>
              <Typography variant="body2">{company.created_at ? formatDate(company.created_at) : '—'}</Typography>
            </Grid>
          </Grid>
        </SectionCard>

        <SectionCard title={t('company.details')} subtitle={canEdit ? undefined : t('company.view_only_hint')}>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            {serverError && <Alert severity="error">{serverError}</Alert>}

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FieldLabel>{t('company.name')}</FieldLabel>
                <TextField
                  fullWidth
                  disabled={!canEdit}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  {...register('name')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FieldLabel>{t('company.name_kh')}</FieldLabel>
                <TextField
                  fullWidth
                  disabled={!canEdit}
                  error={!!errors.name_kh}
                  helperText={errors.name_kh?.message}
                  {...register('name_kh')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FieldLabel>{t('company.registration_no')}</FieldLabel>
                <TextField
                  fullWidth
                  disabled={!canEdit}
                  error={!!errors.registration_no}
                  helperText={errors.registration_no?.message}
                  {...register('registration_no')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FieldLabel>{t('company.employee_count')}</FieldLabel>
                <TextField
                  type="number"
                  fullWidth
                  disabled={!canEdit}
                  error={!!errors.employee_count}
                  helperText={errors.employee_count?.message}
                  {...register('employee_count')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FieldLabel>{t('company.industry')}</FieldLabel>
                <Controller
                  name="industry_code"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth disabled={!canEdit} error={!!errors.industry_code} helperText={errors.industry_code?.message}>
                      {INDUSTRY_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FieldLabel>{t('company.country')}</FieldLabel>
                <Controller
                  name="country_code"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth disabled={!canEdit} error={!!errors.country_code} helperText={errors.country_code?.message}>
                      {COUNTRY_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FieldLabel>{t('company.default_language')}</FieldLabel>
                <Controller
                  name="default_locale"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth disabled={!canEdit} error={!!errors.default_locale} helperText={errors.default_locale?.message}>
                      {LOCALE_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>

            {canEdit && (
              <>
                <Divider />
                <Box className="flex justify-end">
                  <Button type="submit" variant="contained" loading={isSubmitting}>
                    {t('company.save_changes')}
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </SectionCard>
      </Box>
    </>
  );
}
