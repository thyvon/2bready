'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import MuiLink from '@mui/material/Link';
import Box from '@mui/material/Box';

import AuthLayout from '@/components/layouts/AuthLayout';
import { loginSchema, type LoginInput } from '@/domains/auth/schemas';
import { login } from '@/domains/auth/api';
import { useAuthStore } from '@/store/auth.store';
import { getApiError } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, setPendingTotp } = useAuthStore();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setServerError('');
    try {
      const res = await login(data);

      if (!res.totp_required) {
        setAuth(res.user, res.token);
        router.replace('/dashboard');
        return;
      }

      const totpConfirmed = 'totp_confirmed' in res ? res.totp_confirmed : false;

      if (!totpConfirmed) {
        setPendingTotp(res.user, res.token, 'setup_required');
        router.replace('/totp/setup');
      } else {
        setPendingTotp(res.user, res.token, 'challenge');
        router.replace('/totp/challenge');
      }
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  return (
    <AuthLayout title="Sign in">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {serverError && <Alert severity="error" sx={{ py: 0.5 }}>{serverError}</Alert>}

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.75, color: 'text.primary' }}>
              Email address
            </Typography>
            <TextField
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              autoFocus
              fullWidth
              error={!!errors.email}
              helperText={errors.email?.message}
              {...register('email')}
            />
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                Password
              </Typography>
              <MuiLink
                component={Link}
                href="/forgot-password"
                variant="body2"
                underline="hover"
                sx={{ color: 'text.secondary' }}
              >
                Forgot password?
              </MuiLink>
            </Box>
            <TextField
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              fullWidth
              error={!!errors.password}
              helperText={errors.password?.message}
              {...register('password')}
            />
          </Box>

          <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting} sx={{ mt: 0.5 }}>
            Continue
          </Button>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Don&apos;t have an account?{' '}
            <MuiLink component={Link} href="/register" underline="hover" sx={{ fontWeight: 500, color: 'text.primary' }}>
              Sign up
            </MuiLink>
          </Typography>
        </Box>
      </form>
    </AuthLayout>
  );
}
