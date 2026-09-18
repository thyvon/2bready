'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

import { companyFormDefaults, companyFormSchema, type CompanyFormInput, type CompanyFormOutput } from '@/domains/company/schemas';
import { COUNTRY_OPTIONS, LOCALE_OPTIONS, industryLabel, optionLabel } from '@/domains/company/constants';
import { listCountriesWithTemplates } from '@/domains/company/api';
import { useIndustries } from '@/domains/company/hooks';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import FieldLabel from '@/components/forms/FieldLabel';
import FormSelect from '@/components/forms/FormSelect';
import FormTextField from '@/components/forms/FormTextField';
import { FormDatePicker } from '@2bready/ui-core';

interface CompanyFormProps {
  onSubmit: (data: CompanyFormOutput) => Promise<void>;
  submitLabel?: string;
}

export default function CompanyFormWizard({ onSubmit, submitLabel }: CompanyFormProps) {
  const { t, locale } = useTranslation();
  const { industries, loading: industriesLoading } = useIndustries({ withTemplatesOnly: true });
  const [serverError, setServerError] = useState('');
  const [countries, setCountries] = useState<string[]>([]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormInput>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: companyFormDefaults,
  });

  const selectedIndustryId = useWatch({ control, name: 'industry_id' });

  // Default-select F&B once industries load
  useEffect(() => {
    if (getValues('industry_id')) return;
    const fnb = industries.find((i) => i.code === 'F&B');
    if (fnb) setValue('industry_id', fnb.id);
  }, [industries, getValues, setValue]);

  // Fetch countries when industry changes; dropdown is disabled when no
  // industry is selected, and the country_code reset effect handles stale
  // selections when the list updates.
  useEffect(() => {
    if (!selectedIndustryId) return;

    let cancelled = false;

    listCountriesWithTemplates(selectedIndustryId)
      .then((data) => {
        if (!cancelled) setCountries(data);
      })
      .catch(() => {
        if (!cancelled) setCountries([]);
      });

    return () => { cancelled = true; };
  }, [selectedIndustryId]);

  // Reset country when industry changes and current selection is no longer valid
  useEffect(() => {
    if (!selectedIndustryId || countries.length === 0) return;
    const current = getValues('country_code');
    if (current && !countries.includes(current)) {
      setValue('country_code', countries[0]);
    }
  }, [selectedIndustryId, countries, getValues, setValue]);

  const submit = async (data: CompanyFormInput) => {
    setServerError('');
    try {
      await onSubmit(companyFormSchema.parse(data));
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
      {serverError && <Alert severity="error">{serverError}</Alert>}

      <Box>
        <FieldLabel>{t('company.name')}</FieldLabel>
        <FormTextField
          placeholder="e.g. Sabay Bakery Co., Ltd."
          autoFocus
          fullWidth
          error={!!errors.name}
          helperText={errors.name?.message}
          {...register('name')}
        />
      </Box>

      <Box>
        <FieldLabel>{t('company.name_kh')}</FieldLabel>
        <FormTextField
          placeholder="ឈ្មោះក្រុមហ៊ុន"
          fullWidth
          error={!!errors.name_kh}
          helperText={errors.name_kh?.message ?? t('company.bilingual_hint')}
          {...register('name_kh')}
        />
      </Box>

      <Box>
        <FieldLabel>{t('company.registration_no')}</FieldLabel>
        <FormTextField
          placeholder="e.g. 00012345"
          fullWidth
          error={!!errors.registration_no}
          helperText={errors.registration_no?.message ?? t('company.registration_hint')}
          {...register('registration_no')}
        />
      </Box>

      <Box>
        <FieldLabel>{t('company.industry')}</FieldLabel>
        <Controller
          name="industry_id"
          control={control}
          render={({ field }) => (
            <FormSelect {...field} fullWidth disabled={industriesLoading} error={!!errors.industry_id} helperText={errors.industry_id?.message}>
              {industries.map((industry) => (
                <MenuItem key={industry.id} value={industry.id}>{industryLabel(industry, locale)}</MenuItem>
              ))}
            </FormSelect>
          )}
        />
      </Box>

      <Box className="flex gap-4">
        <Box className="flex-1">
          <FieldLabel>{t('company.country')}</FieldLabel>
          <Controller
            name="country_code"
            control={control}
            render={({ field }) => (
              <FormSelect
                {...field}
                fullWidth
                disabled={!selectedIndustryId}
                error={!!errors.country_code}
                helperText={errors.country_code?.message}
              >
                {countries.map((code) => {
                  const opt = COUNTRY_OPTIONS.find((o) => o.value === code);
                  return (
                    <MenuItem key={code} value={code}>
                      {opt ? optionLabel(t, COUNTRY_OPTIONS, code) : code}
                    </MenuItem>
                  );
                })}
              </FormSelect>
            )}
          />
        </Box>
        <Box className="flex-1">
          <FieldLabel>{t('company.employee_count')}</FieldLabel>
          <FormTextField
            placeholder="e.g. 12"
            type="number"
            fullWidth
            error={!!errors.employee_count}
            helperText={errors.employee_count?.message ?? t('company.employee_count_hint')}
            {...register('employee_count')}
          />
        </Box>
      </Box>

      <Box className="flex gap-4">
        <Box className="flex-1">
          <FieldLabel>{t('company.compliance_start_date')}</FieldLabel>
          <Controller
            name="compliance_start_date"
            control={control}
            render={({ field }) => (
              <FormDatePicker
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                fullWidth
                error={!!errors.compliance_start_date}
                helperText={errors.compliance_start_date?.message ?? t('company.compliance_start_date_hint')}
              />
            )}
          />
        </Box>
        <Box className="flex-1">
          <FieldLabel>{t('company.default_language')}</FieldLabel>
          <Controller
            name="default_locale"
            control={control}
            render={({ field }) => (
              <FormSelect {...field} fullWidth error={!!errors.default_locale} helperText={errors.default_locale?.message}>
                {LOCALE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</MenuItem>
                ))}
              </FormSelect>
            )}
          />
        </Box>
      </Box>

      <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting} sx={{ mt: 1 }}>
        {submitLabel ?? t('company.create_company')}
      </Button>
    </Box>
  );
}
