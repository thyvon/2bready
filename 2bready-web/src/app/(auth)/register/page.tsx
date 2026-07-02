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

import AuthLayout from '@/components/layouts/AuthLayout';
import { registerSchema, type RegisterInput } from '@/domains/auth/schemas';
import { register as registerUser } from '@/domains/auth/api';
import { useAuthStore } from '@/store/auth.store';
import { getApiError } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth, setPendingTotp } = useAuthStore();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setServerError('');
    try {
      const res = await registerUser(data);

      if (!res.totp_required) {
        setAuth(res.user, res.token);
        router.replace('/dashboard');
      } else {
        setPendingTotp(res.user, res.token, 'setup_required');
        router.replace('/totp/setup');
      }
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start your compliance journey">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {serverError && <Alert severity="error">{serverError}</Alert>}

        <TextField
          label="Full name"
          autoComplete="name"
          autoFocus
          fullWidth
          error={!!errors.name}
          helperText={errors.name?.message}
          {...register('name')}
        />

        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          fullWidth
          error={!!errors.email}
          helperText={errors.email?.message}
          {...register('email')}
        />

        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          fullWidth
          error={!!errors.password}
          helperText={errors.password?.message}
          {...register('password')}
        />

        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          fullWidth
          error={!!errors.password_confirmation}
          helperText={errors.password_confirmation?.message}
          {...register('password_confirmation')}
        />

        <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting}>
          Create account
        </Button>

        <Typography variant="body2" color="text.secondary" className="text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </Typography>
      </form>
    </AuthLayout>
  );
}
