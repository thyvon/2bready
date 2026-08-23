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
import { GlowButton } from '@2bready/ui-core';
import FormTextField from '@/components/forms/FormTextField';
import { getApiError } from '@2bready/api-client';
import { BrandMark } from '@/components/layout/BrandMark';
import AuroraBackground from '@/components/layout/AuroraBackground';
import { loginSchema, loginDefaults, type LoginInput } from '@/lib/login-schema';
import { login, googleAuthStatus, googleAuthRedirectUrl } from '@/lib/auth-api';
import { completeLogin } from '@/lib/complete-login';
import { useAuthStore } from '@/store/auth.store';
import { useTranslation } from '@/lib/i18n';

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { setAuth, setPendingTotp } = useAuthStore();
  const [serverError, setServerError] = useState('');
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    googleAuthStatus().then(setGoogleEnabled).catch(() => setGoogleEnabled(false));
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: loginDefaults,
  });

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
          boxShadow: '0 24px 64px -16px rgba(0,0,0,0.35)',
        }}
      >
        {/* Left: brand / aurora panel — desktop only */}
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
              <BrandMark size={28} />
            </Box>
            <Typography
              sx={{
                fontSize: '0.85rem',
                fontWeight: 800,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'text.secondary',
                mb: 2,
              }}
            >
              {t('login.brand_tagline')}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 2, color: '#fff' }}>
              {t('login.headline')}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {t('login.subheadline')}
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
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <BrandMark size={28} />
            </Box>

            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
                Welcome back
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Continue your Trust Journey by securely accessing your 2bReady workspace.
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
                label="Business Email"
                type="email"
                required
                autoFocus
                fullWidth
                autoComplete="email"
                placeholder="name@company.com"
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register('email')}
              />
              <Box>
                <FormTextField
                  label="Password"
                  type="password"
                  required
                  fullWidth
                  autoComplete="current-password"
                  placeholder="Enter your password"
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
                    Forgot your password?
                  </MuiLink>
                </Box>
              </Box>

              <GlowButton type="submit" size="medium" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </GlowButton>

              {googleEnabled && (
                <>
                  <Divider sx={{ my: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">OR</Typography>
                  </Divider>
                  <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    startIcon={<GoogleIcon fontSize="small" />}
                    onClick={() => { window.location.href = googleAuthRedirectUrl(); }}
                  >
                    Continue with Google
                  </Button>
                </>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Don&apos;t have an account?{' '}
                <MuiLink component={Link} href="/register" underline="hover" sx={{ fontWeight: 500, color: 'text.primary' }}>
                  Create one
                </MuiLink>
              </Typography>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
              Your information is encrypted and securely protected.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}