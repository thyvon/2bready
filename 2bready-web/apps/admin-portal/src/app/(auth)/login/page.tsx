'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import MuiLink from '@mui/material/Link';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import GoogleIcon from '@mui/icons-material/Google';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageSwitcher from '@/components/layouts/LanguageSwitcher';
import { BrandLogo } from '@2bready/ui-core';
import { useBrandLogo } from '@/domains/branding/hooks';
import { loginSchema, type LoginInput } from '@/domains/auth/schemas';
import { login, googleAuthStatus, googleAuthRedirectUrl } from '@/domains/auth/api';
import { completeLogin } from '@/domains/auth/helpers';
import { useAuthStore } from '@/store/auth.store';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 28) / 24} viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 28L1.5 23.5V6L12 1.5L22.5 6V23.5L12 28Z" fill="currentColor" />
      <path d="M7 14L10.5 17.5L17 11" stroke="var(--mui-palette-background-paper)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, setPendingTotp } = useAuthStore();
  const { t } = useTranslation();
  const [serverError, setServerError] = useState('');
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const lightLogo = useBrandLogo('light');

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
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 3, sm: 4 },
        bgcolor: 'background.default',
      }}
    >
      {/* Language switcher + theme toggle — fixed top-right */}
      <Box sx={{ position: 'fixed', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 0.5, zIndex: 2 }}>
        <LanguageSwitcher />
        <ThemeToggle />
      </Box>

      <Box sx={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Brand mark + logo */}
        <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ color: 'var(--mui-palette-primary-main)', display: 'flex' }}>
            <BrandMark size={34} />
          </Box>
          <BrandLogo
            logoUrl={lightLogo}
            height={30}
            maxWidth={180}
            fallback={
              <Typography sx={{ fontWeight: 700, letterSpacing: '-0.02em', fontSize: '1.2rem' }}>
                2bReady
              </Typography>
            }
          />
        </Box>

        <Box sx={{ width: '100%', mb: 3, textAlign: 'center' }}>
          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'text.secondary',
              mb: 1,
            }}
          >
            {t('auth.admin_portal')}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
            {t('auth.sign_in')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('auth.admin_login_subtitle')}
          </Typography>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4 w-full">
          {serverError && <Alert severity="error">{serverError}</Alert>}

          {/* Social login first — above the divider, Minimals-style */}
          {googleEnabled && (
            <>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<GoogleIcon fontSize="small" />}
                onClick={() => { window.location.href = googleAuthRedirectUrl(); }}
              >
                {t('auth.continue_with_google')}
              </Button>
              <Divider sx={{ my: 0.25 }}>
                <Typography variant="caption" color="text.secondary">{t('auth.or')}</Typography>
              </Divider>
            </>
          )}

          <TextField
            label={t('auth.email_address')}
            placeholder="you@company.com"
            type="email"
            variant="outlined"
            fullWidth
            autoComplete="email"
            autoFocus
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register('email')}
          />

          <TextField
            label={t('auth.password')}
            placeholder="••••••••"
            type="password"
            variant="outlined"
            fullWidth
            autoComplete="current-password"
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register('password')}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
            <MuiLink
              component={Link}
              href="/forgot-password"
              variant="body2"
              underline="hover"
              sx={{ color: 'text.secondary', fontWeight: 500 }}
            >
              {t('auth.forgot_password')}
            </MuiLink>
          </Box>

          <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting} sx={{ mt: 0.5, py: 1.1, fontSize: '0.9rem' }}>
            {t('auth.sign_in')}
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1 }}>
            <LockOutlinedIcon sx={{ fontSize: 13 }} />
            {t('auth.admin_restricted')}
          </Typography>
        </form>
      </Box>
    </Box>
  );
}