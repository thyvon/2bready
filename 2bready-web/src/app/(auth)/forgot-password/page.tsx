'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';

import AuthLayout from '@/components/layouts/AuthLayout';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/domains/auth/schemas';
import { forgotPassword } from '@/domains/auth/api';
import { getApiError } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

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

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="We sent a reset link if that address is registered.">
        <Alert severity="success" className="mb-4">
          If that email exists, a reset link has been sent. Check your inbox (and spam folder).
        </Alert>
        <Link href="/login" className="text-blue-600 hover:underline text-sm">
          Back to sign in
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email to receive a reset link">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {serverError && <Alert severity="error">{serverError}</Alert>}

        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          fullWidth
          error={!!errors.email}
          helperText={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting}>
          Send reset link
        </Button>

        <Typography variant="body2" color="text.secondary" className="text-center">
          <Link href="/login" className="text-blue-600 hover:underline">
            Back to sign in
          </Link>
        </Typography>
      </form>
    </AuthLayout>
  );
}
