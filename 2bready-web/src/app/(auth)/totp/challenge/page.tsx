'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

import AuthLayout from '@/components/layouts/AuthLayout';
import { totpCodeSchema, type TotpCodeInput } from '@/domains/auth/schemas';
import { totpVerify } from '@/domains/auth/api';
import { useAuthStore } from '@/store/auth.store';
import { getApiError } from '@/lib/utils';

export default function TotpChallengePage() {
  const router = useRouter();
  const { totpFlow, completeTotpFlow } = useAuthStore();
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (totpFlow !== 'challenge') {
      router.replace('/login');
    }
  }, [totpFlow, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TotpCodeInput>({ resolver: zodResolver(totpCodeSchema) });

  const onSubmit = async (data: TotpCodeInput) => {
    setServerError('');
    try {
      const cleanToken = await totpVerify(data);
      completeTotpFlow(cleanToken);
      router.replace('/dashboard');
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  return (
    <AuthLayout
      title="Two-factor authentication"
      subtitle="Enter the 6-digit code from your authenticator app"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {serverError && <Alert severity="error">{serverError}</Alert>}

        <TextField
          label="Authentication code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          fullWidth
          error={!!errors.code}
          helperText={errors.code?.message}
          {...register('code')}
        />

        <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting}>
          Verify
        </Button>
      </form>
    </AuthLayout>
  );
}
