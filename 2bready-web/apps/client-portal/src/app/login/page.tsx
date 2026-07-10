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
import { loginSchema, loginDefaults, type LoginInput } from '@/lib/login-schema';
import { login } from '@/lib/auth-api';
import { useAuthStore } from '@/store/auth.store';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState('');

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
      const { user, token } = await login(data);
      setAuth(user, token);
      // A returning owner with no company yet (e.g. they left mid-onboarding)
      // goes back to finish that instead of into a portal with nothing to show.
      router.push(user.current_company_id ? '/' : '/onboarding');
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
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 340 }}>
            Sign in to continue your Trust Journey.
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
            label="Email"
            type="email"
            required
            autoFocus
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
            autoComplete="current-password"
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register('password')}
          />

          <GlowButton type="submit" size="medium" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </GlowButton>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Don&apos;t have an account?{' '}
            <MuiLink component={Link} href="/register" underline="hover" sx={{ fontWeight: 500, color: 'text.primary' }}>
              Sign up
            </MuiLink>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
