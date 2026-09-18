'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import MuiLink from '@mui/material/Link';
import { BrandLogo, GlowButton } from '@2bready/ui-core';

import FormTextField from '@/components/forms/FormTextField';
import AuroraBackground from '@/components/layout/AuroraBackground';
import { BrandMark } from '@/components/layout/BrandMark';
import { useBrandLogoForTheme } from '@/domains/branding/hooks';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/domains/auth/schemas';
import { forgotPassword } from '@/domains/auth/api';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');
  const logoUrl = useBrandLogoForTheme();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setServerError('');
    try {
      await forgotPassword(data);
      setSent(true);
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, md: 4 },
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 1040,
          minHeight: { xs: 'auto', md: 520 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          borderRadius: '24px',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 8px 40px -12px rgba(0,0,0,0.2)',
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: '0 12px 48px -8px rgba(0,0,0,0.28)',
          },
        }}
      >
        {/* Left: aurora panel — desktop only */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            position: 'relative',
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#050810',
          }}
        >
          <AuroraBackground />
          <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', px: 6, maxWidth: 380 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                mx: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '16px',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 8px 24px -8px rgba(0,0,0,0.3)',
                mb: 3,
              }}
            >
              <BrandLogo logoUrl={logoUrl} fallback={<BrandMark size={28} />} height={28} maxWidth={120} />
            </Box>
            <Typography
              sx={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'text.secondary',
                mb: 2,
              }}
            >
              {t('auth.admin_portal')}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 2, color: '#fff' }}>
              {t('auth.forgot_title')}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {t('auth.forgot_subtitle')}
            </Typography>
          </Box>
        </Box>

        {/* Right: form panel */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: 3, sm: 5, md: 6 },
            py: { xs: 5, md: 6 },
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 360 }}>
            {/* Mobile-only logo */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <BrandLogo logoUrl={logoUrl} fallback={<BrandMark size={28} />} height={28} maxWidth={120} />
            </Box>

            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
                {sent ? t('auth.check_email_title') : t('auth.forgot_title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {sent ? t('auth.check_email_subtitle') : t('auth.forgot_subtitle')}
              </Typography>
            </Box>

            {sent ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Alert severity="success" sx={{ width: '100%' }}>
                  {t('auth.check_email_body')}
                </Alert>
                <MuiLink
                  component={Link}
                  href="/login"
                  underline="hover"
                  variant="body2"
                  sx={{ fontWeight: 500, color: 'text.primary' }}
                >
                  {t('auth.back_to_sign_in')}
                </MuiLink>
              </Box>
            ) : (
              <Box
                component="form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
              >
                {serverError && <Alert severity="error">{serverError}</Alert>}

                <FormTextField
                  label={t('auth.email_address')}
                  type="email"
                  required
                  autoFocus
                  fullWidth
                  autoComplete="email"
                  placeholder="admin@2bready.com"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  {...register('email')}
                />

                <GlowButton type="submit" size="medium" disabled={isSubmitting}>
                  {isSubmitting ? `${t('auth.send_reset_link')}…` : t('auth.send_reset_link')}
                </GlowButton>

                <MuiLink
                  component={Link}
                  href="/login"
                  underline="hover"
                  variant="body2"
                  sx={{ color: 'text.secondary', textAlign: 'center', mt: 1 }}
                >
                  {t('auth.back_to_sign_in')}
                </MuiLink>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
