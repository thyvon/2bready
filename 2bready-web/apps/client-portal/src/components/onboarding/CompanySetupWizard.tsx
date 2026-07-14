'use client';

import { Fragment, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { GlowButton, stepTransition, easeOutExpo } from '@2bready/ui-core';
import {
  COMPANY_SETUP_STEPS,
  companySetupDefaults,
  companySetupSchema,
  COUNTRY_OPTIONS,
  optionLabel,
  type CompanySetupInput,
  type CompanySetupOutput,
} from '@/lib/company-setup-schema';
import { useIndustries } from '@/lib/useIndustries';
import { useTranslation } from '@/lib/i18n';
import { getApiError } from '@2bready/api-client';

export interface CompanySetupWizardProps {
  onComplete: (data: CompanySetupOutput) => Promise<void>;
}

const STEP_ICONS = [
  <ApartmentOutlinedIcon key="identity" fontSize="small" />,
  <CategoryOutlinedIcon key="profile" fontSize="small" />,
  <TaskAltOutlinedIcon key="review" fontSize="small" />,
];

// Horizontal circle-and-connector stepper — the same visual DNA as
// JourneyTree's level nodes (circle + connecting line + glow on the active
// one), not a generic admin-dashboard progress bar. Onboarding is the very
// first thing a company sees, so it should already look like the product
// they're about to use, not a bureaucratic form.
function StepIndicator({ step }: { step: number }) {
  return (
    <Box className="flex items-start" sx={{ mb: 5 }}>
      {COMPANY_SETUP_STEPS.map((s, i) => {
        const isComplete = i < step;
        const isCurrent = i === step;
        return (
          <Fragment key={s.label}>
            <Box className="flex flex-col items-center" sx={{ width: 88, flexShrink: 0 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid',
                  borderColor: isComplete || isCurrent ? 'primary.main' : 'divider',
                  bgcolor: isComplete ? 'primary.main' : 'background.paper',
                  color: isComplete ? 'primary.contrastText' : isCurrent ? 'primary.main' : 'text.disabled',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isCurrent
                    ? '0 0 0 4px color-mix(in srgb, var(--mui-palette-primary-main) 15%, transparent), 0 4px 16px -4px color-mix(in srgb, var(--mui-palette-primary-main) 45%, transparent)'
                    : 'none',
                }}
              >
                {isComplete ? <CheckIcon fontSize="small" /> : STEP_ICONS[i]}
              </Box>
              <Typography
                variant="caption"
                sx={{ mt: 0.75, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'text.primary' : 'text.secondary' }}
              >
                {s.label}
              </Typography>
            </Box>
            {i < COMPANY_SETUP_STEPS.length - 1 && (
              <Box sx={{ flex: 1, height: 2, mt: '19px', bgcolor: 'divider', overflow: 'hidden' }}>
                <motion.div
                  initial={false}
                  animate={{ scaleX: isComplete ? 1 : 0 }}
                  transition={easeOutExpo}
                  style={{ transformOrigin: 'left', height: '100%', background: 'var(--mui-palette-primary-main)' }}
                />
              </Box>
            )}
          </Fragment>
        );
      })}
    </Box>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <Box
      className="flex items-center justify-between gap-4"
      sx={{ px: 2.5, py: 1.5, '&:not(:last-of-type)': { borderBottom: '1px solid', borderColor: 'divider' } }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
        {value}
      </Typography>
    </Box>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden' }}>
      <Box className="flex items-center justify-between" sx={{ px: 2.5, py: 1.25, bgcolor: 'action.hover' }}>
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'text.secondary' }}
        >
          {title}
        </Typography>
        <Button size="small" onClick={onEdit} sx={{ minWidth: 0, py: 0.25, fontSize: '0.75rem', fontWeight: 600 }}>
          Edit
        </Button>
      </Box>
      {children}
    </Box>
  );
}

// onComplete calls the real registerOwnCompany endpoint (see onboarding/page.tsx)
// — errors (e.g. a transient network failure) surface back here so the user
// doesn't lose their entered data and can just retry from the review step.
export function CompanySetupWizard({ onComplete }: CompanySetupWizardProps) {
  const { locale } = useTranslation();
  const { industries, loading: industriesLoading } = useIndustries();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [serverError, setServerError] = useState('');

  const {
    register,
    control,
    trigger,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanySetupInput>({
    resolver: zodResolver(companySetupSchema),
    defaultValues: companySetupDefaults,
  });

  const values = watch();
  const isLastStep = step === COMPANY_SETUP_STEPS.length - 1;

  const goToStep = (index: number) => {
    setDirection(-1);
    setStep(index);
  };

  const handleNext = async () => {
    const fields = COMPANY_SETUP_STEPS[step].fields;
    const valid = fields.length === 0 || (await trigger(fields as unknown as (keyof CompanySetupInput)[]));
    if (!valid) return;
    setDirection(1);
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const submit = async (data: CompanySetupInput) => {
    setServerError('');
    try {
      await onComplete(companySetupSchema.parse(data));
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(submit)} noValidate>
      <StepIndicator step={step} />

      {serverError && (
        <Box
          className="flex items-start gap-3"
          sx={{
            mb: 3,
            p: 2,
            borderRadius: '12px',
            border: '1px solid',
            borderColor: 'error.main',
            bgcolor: 'color-mix(in srgb, var(--mui-palette-error-main) 8%, transparent)',
          }}
        >
          <Box
            className="flex items-center justify-center"
            sx={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              bgcolor: 'error.main',
              flexShrink: 0,
              mt: '2px',
            }}
          >
            <Typography sx={{ color: '#fff', fontSize: '0.7rem', fontWeight: 700, lineHeight: 1 }}>!</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'error.main' }}>
            {serverError}
          </Typography>
        </Box>
      )}

      {/* pt here (not on the inner step boxes) matters: overflow:hidden clips
          anything outside this box's own padding box, and MUI's outlined
          TextField floats its label to straddle the input's top border —
          without headroom above the first field, that label was getting
          clipped by this very wrapper. mt:-1 cancels the pt so the step
          indicator above doesn't gain extra visual gap. */}
      <Box sx={{ minHeight: 260, position: 'relative', overflow: 'hidden', pt: 1, mt: -1 }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={step} custom={direction} initial="initial" animate="animate" exit="exit" variants={stepTransition(direction)}>
            {step === 0 && (
              <Box className="flex flex-col gap-5">
                <TextField
                  label="Company Name"
                  required
                  placeholder="e.g. Sabay Bakery Co., Ltd."
                  autoFocus
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><ApartmentOutlinedIcon fontSize="small" color="action" /></InputAdornment> } }}
                  {...register('name')}
                />
                <TextField
                  label="Company Name (Khmer)"
                  placeholder="ឈ្មោះក្រុមហ៊ុន"
                  fullWidth
                  error={!!errors.name_kh}
                  helperText={errors.name_kh?.message ?? 'Optional — helps generate bilingual certificates later.'}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><LanguageOutlinedIcon fontSize="small" color="action" /></InputAdornment> } }}
                  {...register('name_kh')}
                />
                <TextField
                  label="Business Registration No."
                  placeholder="e.g. 00012345"
                  fullWidth
                  error={!!errors.registration_no}
                  helperText={errors.registration_no?.message ?? 'Optional — from your MoC registration certificate, if you have one already.'}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><BadgeOutlinedIcon fontSize="small" color="action" /></InputAdornment> } }}
                  {...register('registration_no')}
                />
              </Box>
            )}

            {step === 1 && (
              <Box className="flex flex-col gap-5">
                <Controller
                  name="industry_id"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Industry"
                      required
                      fullWidth
                      disabled={industriesLoading}
                      error={!!errors.industry_id}
                      helperText={errors.industry_id?.message}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><CategoryOutlinedIcon fontSize="small" color="action" /></InputAdornment> } }}
                    >
                      {industries.map((industry) => (
                        <MenuItem key={industry.id} value={industry.id}>
                          {locale === 'kh' && industry.name_kh ? industry.name_kh : industry.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Controller
                  name="country_code"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Country"
                      required
                      fullWidth
                      error={!!errors.country_code}
                      helperText={errors.country_code?.message}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><PublicOutlinedIcon fontSize="small" color="action" /></InputAdornment> } }}
                    >
                      {COUNTRY_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Box
                  className="flex items-start gap-2"
                  sx={{ bgcolor: 'action.hover', borderRadius: '8px', p: 1.5, mt: 1 }}
                >
                  <TaskAltOutlinedIcon sx={{ fontSize: '1rem', color: 'primary.main', mt: '2px' }} />
                  <Typography variant="caption" color="text.secondary">
                    Your industry determines which compliance pathway (documents, milestones, and levels) applies to
                    your company.
                  </Typography>
                </Box>
              </Box>
            )}

            {step === 2 && (
              <Box className="flex flex-col gap-4">
                <Typography variant="body2" color="text.secondary">
                  Review your details before continuing to your dashboard.
                </Typography>

                <ReviewSection title="Company Identity" onEdit={() => goToStep(0)}>
                  <ReviewRow label="Company Name" value={values.name || '—'} />
                  <ReviewRow label="Khmer Name" value={values.name_kh || '—'} />
                  <ReviewRow label="Registration No." value={values.registration_no || '—'} />
                </ReviewSection>

                <ReviewSection title="Business Profile" onEdit={() => goToStep(1)}>
                  <ReviewRow
                    label="Industry"
                    value={(() => {
                      const selected = industries.find((i) => i.id === values.industry_id);
                      if (!selected) return '—';
                      return locale === 'kh' && selected.name_kh ? selected.name_kh : selected.name;
                    })()}
                  />
                  <ReviewRow label="Country" value={optionLabel(COUNTRY_OPTIONS, values.country_code)} />
                </ReviewSection>
              </Box>
            )}
          </motion.div>
        </AnimatePresence>
      </Box>

      <Box className="flex items-center justify-between" sx={{ mt: 4 }}>
        <Button variant="text" onClick={handleBack} disabled={step === 0} startIcon={<ArrowBackRoundedIcon fontSize="small" />}>
          Back
        </Button>
        {isLastStep ? (
          // type="button" + explicit handleSubmit(submit) on purpose, not
          // type="submit" — the Next button one step earlier is type="button"
          // in this exact same JSX slot, and morphing a button's type on the
          // very click that triggers the re-render can make the browser treat
          // that click as hitting the new submit-type button, auto-submitting
          // before the review screen ever gets a chance to render. Matches
          // admin-portal's CompanyFormWizard, which avoids this the same way.
          <GlowButton type="button" onClick={handleSubmit(submit)} size="medium" disabled={isSubmitting}>
            {isSubmitting ? 'Setting up…' : 'Enter Your Portal'}
          </GlowButton>
        ) : (
          <GlowButton type="button" onClick={handleNext} size="medium">
            <Box className="flex items-center gap-1">
              Next
              <ArrowForwardRoundedIcon fontSize="small" />
            </Box>
          </GlowButton>
        )}
      </Box>
    </Box>
  );
}