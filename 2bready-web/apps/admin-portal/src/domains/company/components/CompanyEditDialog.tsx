'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';

import { companyEditSchema, companyEditDefaults, type CompanyEditInput, type CompanyEditOutput } from '@/domains/company/schemas';
import { COUNTRY_OPTIONS, LOCALE_OPTIONS, STATUS_OPTIONS, industryLabel } from '@/domains/company/constants';
import { useIndustries } from '@/domains/company/hooks';
import { updateCompany } from '@/domains/company/api';
import type { Company } from '@/domains/company/types';
import { useToast } from '@/components/feedback/ToastProvider';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import FieldLabel from '@/components/forms/FieldLabel';
import FormSelect from '@/components/forms/FormSelect';
import FormTextField from '@/components/forms/FormTextField';

interface CompanyEditDialogProps {
  open: boolean;
  company: Company;
  onClose: () => void;
  onSaved: (company: Company) => void;
}

// Flat single-page form (not CompanyFormWizard's 3 steps) — editing an
// already-known company is a quick correction, not onboarding. Includes
// `status`, which only this app's users (admin/staff/finance) may ever set.
export default function CompanyEditDialog({ open, company, onClose, onSaved }: CompanyEditDialogProps) {
  const { t, locale } = useTranslation();
  const { industries, loading: industriesLoading } = useIndustries();
  const toast = useToast();
  const [serverError, setServerError] = useState('');

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyEditInput>({
    resolver: zodResolver(companyEditSchema),
    defaultValues: companyEditDefaults(company),
  });

  useEffect(() => {
    if (open) {
      reset(companyEditDefaults(company));
      setServerError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, company]);

  const submit = async (data: CompanyEditInput) => {
    setServerError('');
    try {
      const parsed: CompanyEditOutput = companyEditSchema.parse(data);
      const updated = await updateCompany(company.id, {
        name: parsed.name,
        name_kh: parsed.name_kh || undefined,
        registration_no: parsed.registration_no || undefined,
        compliance_start_date: parsed.compliance_start_date || null,
        industry_id: parsed.industry_id,
        country_code: parsed.country_code,
        employee_count: parsed.employee_count ?? null,
        default_locale: parsed.default_locale,
        status: parsed.status,
      });
      toast.success(t('company.update_success'));
      onSaved(updated);
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit(submit)} noValidate>
        <DialogTitle>{t('company.edit_company')}</DialogTitle>
        <DialogContent className="flex flex-col gap-5" sx={{ pt: '8px !important' }}>
          {serverError && <Alert severity="error" sx={{ py: 0.5 }}>{serverError}</Alert>}

          <Box>
            <FieldLabel>{t('company.name')}</FieldLabel>
            <FormTextField fullWidth autoFocus error={!!errors.name} helperText={errors.name?.message} {...register('name')} />
          </Box>

          <Box>
            <FieldLabel>{t('company.name_kh')}</FieldLabel>
            <FormTextField fullWidth error={!!errors.name_kh} helperText={errors.name_kh?.message} {...register('name_kh')} />
          </Box>

          <Box>
            <FieldLabel>{t('company.registration_no')}</FieldLabel>
            <FormTextField fullWidth error={!!errors.registration_no} helperText={errors.registration_no?.message} {...register('registration_no')} />
          </Box>

          <Box>
            <FieldLabel>{t('company.compliance_start_date')}</FieldLabel>
            <FormTextField
              type="date"
              fullWidth
              error={!!errors.compliance_start_date}
              helperText={errors.compliance_start_date?.message ?? t('company.compliance_start_date_hint')}
              slotProps={{ inputLabel: { shrink: true } }}
              {...register('compliance_start_date')}
            />
          </Box>

          <Box className="flex gap-4">
            <Box className="flex-1">
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
            <Box className="flex-1">
              <FieldLabel>{t('company.country')}</FieldLabel>
              <Controller
                name="country_code"
                control={control}
                render={({ field }) => (
                  <FormSelect {...field} fullWidth error={!!errors.country_code} helperText={errors.country_code?.message}>
                    {COUNTRY_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</MenuItem>
                    ))}
                  </FormSelect>
                )}
              />
            </Box>
          </Box>

          <Box className="flex gap-4">
            <Box className="flex-1">
              <FieldLabel>{t('company.employee_count')}</FieldLabel>
              <FormTextField
                type="number"
                fullWidth
                error={!!errors.employee_count}
                helperText={errors.employee_count?.message}
                {...register('employee_count')}
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

          <Box>
            <FieldLabel>{t('common.status')}</FieldLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormSelect {...field} fullWidth error={!!errors.status} helperText={errors.status?.message}>
                  {STATUS_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</MenuItem>
                  ))}
                </FormSelect>
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="text" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>{t('common.save')}</Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
