'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import MuiLink from '@mui/material/Link';
import GoogleIcon from '@mui/icons-material/Google';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { GlowButton, BrandLogo } from '@2bready/ui-core';

import LanguageSwitcher from '@/components/layouts/LanguageSwitcher';
import ThemeToggle from '@/components/ui/ThemeToggle';
import FormTextField from '@/components/forms/FormTextField';
import AuroraBackground from '@/components/layout/AuroraBackground';
import { BrandMark } from '@/components/layout/BrandMark';
import { useBrandLogoForTheme } from '@/domains/branding/hooks';
import { loginSchema, type LoginInput } from '@/domains/auth/schemas';
import { login, googleAuthStatus, googleAuthRedirectUrl } from '@/domains/auth/api';
import { completeLogin } from '@/domains/auth/helpers';
import { useAuthStore } from '@/store/auth.store';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, setPendingTotp } = useAuthStore();
  const { t } = useTranslation();
  const [serverError, setServerError] = useState('');
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const logoUrl = useBrandLogoForTheme();

  useEffect(() => {
    googleAuthStatus().then(setGoogleEnabled).catch(() => setGoogleEnabled(false));
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setServerError('');
    try {
      const res = await login(data);
      completeLogin(res, router, { setAuth, setPendingTotp });
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
          minHeight: { xs: 'auto', md: 620 },
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
                boxShadow:
                  '0 0 0 1px color-mix(in srgb, var(--mui-palette-primary-main) 10%, transparent), 0 8px 24px -8px color-mix(in srgb, var(--mui-palette-primary-main) 35%, transparent)',
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
              {t('auth.sign_in')}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {t('auth.admin_login_subtitle')}
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

            {/* Language switcher + theme toggle — mobile only */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'flex-end', mb: 2, alignItems: 'center', gap: 0.5 }}>
              <LanguageSwitcher />
              <ThemeToggle />
            </Box>

            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
                {t('auth.sign_in')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t('auth.admin_login_subtitle')}
              </Typography>
            </Box>

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

              <Box>
                <FormTextField
                  label={t('auth.password')}
                  type="password"
                  required
                  fullWidth
                  autoComplete="current-password"
                  placeholder="••••••••"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  {...register('password')}
                />
                <Box sx={{ textAlign: 'right', mt: 0.75 }}>
                  <MuiLink
                    component={Link}
                    href="/forgot-password"
                    underline="hover"
                    variant="body2"
                    sx={{ color: 'text.secondary' }}
                  >
                    {t('auth.forgot_password')}
                  </MuiLink>
                </Box>
              </Box>

              <GlowButton type="submit" size="medium" disabled={isSubmitting}>
                {isSubmitting ? `${t('auth.sign_in')}…` : t('auth.sign_in')}
              </GlowButton>

              {googleEnabled && (
                <>
                  <Divider sx={{ my: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">{t('auth.or')}</Typography>
                  </Divider>
                  <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    startIcon={<GoogleIcon fontSize="small" />}
                    onClick={() => { window.location.href = googleAuthRedirectUrl(); }}
                  >
                    {t('auth.continue_with_google')}
                  </Button>
                </>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1 }}>
                <LockOutlinedIcon sx={{ fontSize: 13 }} />
                {t('auth.admin_restricted')}
              </Typography>
            </Box>
          </Box>

          {/* Desktop-only language/theme controls */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, mt: 3, alignItems: 'center', gap: 0.5 }}>
            <LanguageSwitcher />
            <ThemeToggle />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
