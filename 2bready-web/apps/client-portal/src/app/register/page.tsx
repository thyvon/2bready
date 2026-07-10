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
import { registerSchema, registerDefaults, type RegisterInput } from '@/lib/register-schema';
import { registerOwner } from '@/lib/auth-api';
import { useAuthStore } from '@/store/auth.store';
import { useLocale } from '@/components/LocaleProvider';

// Standalone account-creation step, deliberately separate from the company
// setup wizard at /onboarding — the backend lets a company_owner register
// more than one company over time (RegisterOwnCompanyAction, §0.7 of the MVP
// proposal), so "create my account" and "create a company" have to stay two
// independently reusable steps, not one combined form. See onboarding/page.tsx
// for what happens after this succeeds.
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
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 6,
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 900,
          height: 900,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, color-mix(in srgb, var(--mui-palette-primary-main) 8%, transparent) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        <Box className="flex flex-col items-center" sx={{ mb: 4, textAlign: 'center' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '16px',
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow:
                '0 0 0 1px color-mix(in srgb, var(--mui-palette-primary-main) 10%, transparent), 0 8px 24px -8px color-mix(in srgb, var(--mui-palette-primary-main) 35%, transparent)',
            }}
          >
            <BrandMark size={28} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.01em', mt: 2.5 }}>
            Create your account
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 340 }}>
            Then set up your company profile to enter your Trust Journey.
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '16px',
            bgcolor: 'background.paper',
            boxShadow: '0 12px 40px -12px rgba(0, 0, 0, 0.12)',
            p: { xs: 3, sm: 4 },
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }}
        >
          {serverError && <Alert severity="error">{serverError}</Alert>}

          <TextField
            label="Your Name"
            required
            autoFocus
            fullWidth
            error={!!errors.name}
            helperText={errors.name?.message}
            {...register('name')}
          />
          <TextField
            label="Email"
            type="email"
            required
            fullWidth
            autoComplete="email"
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
            error={!!errors.password}
            helperText={errors.password?.message ?? 'At least 8 characters, with upper, lower, and a number.'}
            {...register('password')}
          />
          <TextField
            label="Confirm Password"
            type="password"
            required
            fullWidth
            autoComplete="new-password"
            error={!!errors.password_confirmation}
            helperText={errors.password_confirmation?.message}
            {...register('password_confirmation')}
          />

          <GlowButton type="submit" size="medium" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Continue'}
          </GlowButton>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Already have an account?{' '}
            <MuiLink component={Link} href="/login" underline="hover" sx={{ fontWeight: 500, color: 'text.primary' }}>
              Sign in
            </MuiLink>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
