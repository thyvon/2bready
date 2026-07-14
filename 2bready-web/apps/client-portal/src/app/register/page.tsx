'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import MuiLink from '@mui/material/Link';
import { GlowButton } from '@2bready/ui-core';
import { getApiError } from '@2bready/api-client';
import { BrandMark } from '@/components/layout/BrandMark';
import AuroraBackground from '@/components/layout/AuroraBackground';
import { registerSchema, registerDefaults, type RegisterInput } from '@/lib/register-schema';
import { registerOwner } from '@/lib/auth-api';
import { useAuthStore } from '@/store/auth.store';
import { useLocale } from '@/components/LocaleProvider';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { locale } = useLocale();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: registerDefaults,
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError('');
    try {
      const { user, token } = await registerOwner(data, locale);
      setAuth(user, token);
      router.push('/onboarding');
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
              Comply. Scale. Lead.
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 2, color: '#fff' }}>
              The Digital Trust Engine for ASEAN.
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Join ASEAN SMEs building verified trust with customers, banks, and investors.
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
                Create your account
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Start your Trust Journey by creating a secure account and building your organization&apos;s digital trust profile.
              </Typography>
            </Box>

            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
            >
              {serverError && <Alert severity="error">{serverError}</Alert>}

              <TextField
                label="Full Name"
                required
                autoFocus
                fullWidth
                placeholder="John Smith"
                error={!!errors.name}
                helperText={errors.name?.message}
                {...register('name')}
              />
              <TextField
                label="Business Email"
                type="email"
                required
                fullWidth
                autoComplete="email"
                placeholder="name@company.com"
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register('email')}
              />
              <TextField
                label="Password"
                type="password"
                required
                fullWidth
                autoComplete="new-password"
                placeholder="Enter your password"
                error={!!errors.password}
                helperText={errors.password?.message ?? 'Use at least 8 characters with uppercase, lowercase, and a number.'}
                {...register('password')}
              />
              <TextField
                label="Confirm Password"
                type="password"
                required
                fullWidth
                autoComplete="new-password"
                placeholder="Confirm your password"
                error={!!errors.password_confirmation}
                helperText={errors.password_confirmation?.message}
                {...register('password_confirmation')}
              />

              <GlowButton type="submit" size="medium" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account…' : 'Create Account'}
              </GlowButton>

              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Already have an account?{' '}
                <MuiLink component={Link} href="/login" underline="hover" sx={{ fontWeight: 500, color: 'text.primary' }}>
                  Sign In
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