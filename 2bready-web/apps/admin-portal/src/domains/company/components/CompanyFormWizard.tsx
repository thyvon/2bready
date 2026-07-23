'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

import { COMPANY_FORM_STEPS, companyFormDefaults, companyFormSchema, type CompanyFormInput, type CompanyFormOutput } from '@/domains/company/schemas';
import { COUNTRY_OPTIONS, LOCALE_OPTIONS, optionLabel, industryLabel } from '@/domains/company/constants';
import { useIndustries } from '@/domains/company/hooks';
import { stepTransition, easeOut } from '@/lib/motion';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import FieldLabel from '@/components/forms/FieldLabel';
import FormSelect from '@/components/forms/FormSelect';
import FormTextField from '@/components/forms/FormTextField';

interface CompanyFormWizardProps {
  onSubmit: (data: CompanyFormOutput) => Promise<void>;
  submitLabel?: string;
}

function WizardProgress({ step, t }: { step: number; t: ReturnType<typeof useTranslation>['t'] }) {
  const total = COMPANY_FORM_STEPS.length;
  const percent = ((step + 1) / total) * 100;

  return (
    <Box sx={{ mb: 5 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1.25 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.08em', fontWeight: 600 }}>
          {t('common.step_of', { current: step + 1, total })}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {t(COMPANY_FORM_STEPS[step].labelKey)}
        </Typography>
      </Box>
      <Box sx={{ height: 4, borderRadius: 999, bgcolor: 'divider', overflow: 'hidden' }}>
        <motion.div
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={easeOut}
          style={{ height: '100%', borderRadius: 999, background: 'var(--mui-palette-text-primary)' }}
        />
      </Box>
    </Box>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        px: 2.5,
        py: 1.5,
        '&:not(:last-of-type)': { borderBottom: '1px solid', borderColor: 'divider' },
      }}
    >
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'right' }}>{value}</Typography>
    </Box>
  );
}

export default function CompanyFormWizard({ onSubmit, submitLabel }: CompanyFormWizardProps) {
  const { t, locale } = useTranslation();
  const { industries, loading: industriesLoading } = useIndustries();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [serverError, setServerError] = useState('');

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormInput>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: companyFormDefaults,
  });

  // Default-select F&B once the real industry list loads — by its stable
  // `code`, never a hardcoded id (ids are per-environment ULIDs, not a
  // literal to bake into source). Only when the field is still untouched,
  // so this never overwrites a manual selection.
  useEffect(() => {
    if (getValues('industry_id')) return;
    const fnb = industries.find((i) => i.code === 'F&B');
    if (fnb) setValue('industry_id', fnb.id);
  }, [industries, getValues, setValue]);

  const values = watch();
  const isLastStep = step === COMPANY_FORM_STEPS.length - 1;

  const handleNext = async () => {
    const fields = COMPANY_FORM_STEPS[step].fields;
    const valid = await trigger(fields as unknown as (keyof CompanyFormInput)[]);
    if (!valid) return;
    setDirection(1);
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const submit = async (data: CompanyFormInput) => {
    setServerError('');
    try {
      await onSubmit(companyFormSchema.parse(data));
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(submit)} noValidate>
      <WizardProgress step={step} t={t} />

      {serverError && <Alert severity="error" sx={{ mb: 3 }}>{serverError}</Alert>}

      <Box sx={{ minHeight: 280, position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={step} custom={direction} initial="initial" animate="animate" exit="exit" variants={stepTransition(direction)}>
            {step === 0 && (
              <Box className="flex flex-col gap-5">
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
              </Box>
            )}

            {step === 1 && (
              <Box className="flex flex-col gap-5">
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
                <Box>
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
                <Box>
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
            )}

            {step === 2 && (
              <Box className="flex flex-col gap-5">
                <Box>
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

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>{t('company.review')}</Typography>
                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', overflow: 'hidden', bgcolor: 'background.paper' }}>
                    <ReviewRow label={t('company.name')} value={values.name || '—'} />
                    <ReviewRow label={t('company.name_kh')} value={values.name_kh || '—'} />
                    <ReviewRow label={t('company.registration_no')} value={values.registration_no || '—'} />
                    <ReviewRow label={t('company.employee_count')} value={values.employee_count != null ? String(values.employee_count) : '—'} />
                    <ReviewRow
                      label={t('company.industry')}
                      value={(() => {
                        const selected = industries.find((i) => i.id === values.industry_id);
                        return selected ? industryLabel(selected, locale) : '—';
                      })()}
                    />
                    <ReviewRow label={t('company.country')} value={optionLabel(t, COUNTRY_OPTIONS, values.country_code)} />
                  </Box>
                </Box>
              </Box>
            )}
          </motion.div>
        </AnimatePresence>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box className="flex justify-between">
        <Button
          variant="text"
          onClick={handleBack}
          disabled={step === 0}
          startIcon={<ArrowBackRoundedIcon fontSize="small" />}
        >
          {t('common.back')}
        </Button>
        {isLastStep ? (
          <Button type="button" variant="contained" loading={isSubmitting} onClick={handleSubmit(submit)}>
            {submitLabel ?? t('company.create_company')}
          </Button>
        ) : (
          <Button
            type="button"
            variant="contained"
            onClick={handleNext}
            endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
          >
            {t('common.next')}
          </Button>
        )}
      </Box>
    </Box>
  );
}
