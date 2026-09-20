'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

import { SectionCard } from '@2bready/ui-core';
import { FormDatePicker } from '@2bready/ui-core';
import FormTextField from '@/components/forms/FormTextField';
import FormSelect from '@/components/forms/FormSelect';
import { useAuthStore } from '@/store/auth.store';
import { updateCompany } from '@/lib/company-api';
import { companyProfileSchema, type CompanyProfileInput, companyProfileDefaults } from '@/lib/company-profile-schema';
import { COUNTRY_OPTIONS } from '@/lib/company-setup-schema';
import { useIndustries, type IndustryOption } from '@/lib/useIndustries';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/ToastProvider';

export default function CompanyProfilePage() {
  const { t, locale } = useTranslation();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [serverError, setServerError] = useState('');
  const { industries, loading: industriesLoading } = useIndustries();

  const companies = user?.companies ?? [];
  const current = companies.find((c) => c.id === user?.current_company_id) ?? companies[0];

  const form = useForm<CompanyProfileInput>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: companyProfileDefaults,
  });

  useEffect(() => {
    if (!current) return;
    form.reset({
      name: current.name ?? '',
      name_kh: current.name_kh ?? '',
      registration_no: current.registration_no ?? '',
      industry_id: current.industry_id ?? '',
      country_code: current.country_code ?? 'KH',
      compliance_start_date: current.compliance_start_date ?? '',
      default_locale: (current.default_locale as 'en' | 'kh') ?? 'en',
    });
  }, [current, form]);

  const onSubmit = async (data: CompanyProfileInput) => {
    if (!current) return;
    setServerError('');
    try {
      const updated = await updateCompany(current.id, {
        name: data.name,
        name_kh: data.name_kh || null,
        registration_no: data.registration_no || null,
        industry_id: data.industry_id,
        country_code: data.country_code,
        compliance_start_date: data.compliance_start_date || null,
        default_locale: data.default_locale,
      });

      const updatedCompanies = companies.map((c) => (c.id === updated.id ? updated : c));
      if (user) {
        updateUser({ ...user, companies: updatedCompanies as typeof user.companies });
      }

      toast.success(t('settings.company_saved'));
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  if (!current) return null;

  const hasActiveJourney = false;
  const hasActiveSubscription = false;
  const isIndustryCountryLocked = hasActiveJourney || hasActiveSubscription;

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }} className="flex flex-col gap-6">
      <SectionCard>
        <Box className="flex items-center justify-between">
          <Box>
            <Typography variant="h6">{current.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {current.registration_no ? `${t('settings.company_registration_no_label')}: ${current.registration_no}` : t('settings.company_registration_no_label')}
            </Typography>
          </Box>
          <Chip
            label={current.status}
            color={current.status === 'active' ? 'success' : 'default'}
            size="small"
            variant="outlined"
          />
        </Box>
      </SectionCard>

      <SectionCard title={t('settings.company_title')}>
        <Box component="form" onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {serverError && <Alert severity="error" onClose={() => setServerError('')}>{serverError}</Alert>}

          <FormTextField
            label={t('settings.company_name_label')}
            fullWidth
            error={!!form.formState.errors.name}
            helperText={form.formState.errors.name?.message}
            {...form.register('name')}
          />

          <FormTextField
            label={t('settings.company_name_kh_label')}
            fullWidth
            error={!!form.formState.errors.name_kh}
            helperText={form.formState.errors.name_kh?.message}
            {...form.register('name_kh')}
          />

          <FormTextField
            label={t('settings.company_registration_no_label')}
            fullWidth
            error={!!form.formState.errors.registration_no}
            helperText={form.formState.errors.registration_no?.message}
            {...form.register('registration_no')}
          />

          <Controller
            name="industry_id"
            control={form.control}
            render={({ field }) => (
              <FormSelect
                {...field}
                label={t('settings.company_industry_label')}
                required
                fullWidth
                disabled={isIndustryCountryLocked || industriesLoading}
                error={!!form.formState.errors.industry_id}
                helperText={form.formState.errors.industry_id?.message ?? (isIndustryCountryLocked ? t('settings.company_info_locked') : undefined)}
              >
                {industries.map((industry: IndustryOption) => (
                  <MenuItem key={industry.id} value={industry.id}>
                    {locale === 'kh' && industry.name_kh ? industry.name_kh : industry.name}
                  </MenuItem>
                ))}
              </FormSelect>
            )}
          />

          <Controller
            name="country_code"
            control={form.control}
            render={({ field }) => (
              <FormSelect
                {...field}
                label={t('settings.company_country_label')}
                required
                fullWidth
                disabled={isIndustryCountryLocked}
                error={!!form.formState.errors.country_code}
                helperText={form.formState.errors.country_code?.message ?? (isIndustryCountryLocked ? t('settings.company_info_locked') : undefined)}
              >
                {COUNTRY_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </FormSelect>
            )}
          />

          <Controller
            name="compliance_start_date"
            control={form.control}
            render={({ field }) => (
              <FormDatePicker
                label={t('settings.company_compliance_start_date')}
                variant="outlined"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                fullWidth
                error={!!form.formState.errors.compliance_start_date}
                helperText={form.formState.errors.compliance_start_date?.message ?? t('settings.company_compliance_start_date_helper')}
              />
            )}
          />

          <Controller
            name="default_locale"
            control={form.control}
            render={({ field }) => (
              <FormSelect
                {...field}
                label={t('settings.company_default_locale_label')}
                required
                fullWidth
                error={!!form.formState.errors.default_locale}
                helperText={form.formState.errors.default_locale?.message}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="kh">ភាសាខ្មែរ</MenuItem>
              </FormSelect>
            )}
          />

          <Box className="flex justify-end">
            <Button type="submit" variant="contained" loading={form.formState.isSubmitting}>
              {t('settings.company_save')}
            </Button>
          </Box>
        </Box>
      </SectionCard>
    </Box>
  );
}
