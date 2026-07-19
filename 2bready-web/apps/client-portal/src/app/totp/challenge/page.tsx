'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

import { AuthCard } from '@/components/layout/AuthCard';
import { totpCodeSchema, type TotpCodeInput } from '@/lib/totp-code-schema';
import { totpVerify } from '@/lib/auth-api';
import { useAuthStore } from '@/store/auth.store';
import { getApiError } from '@2bready/api-client';

export default function TotpChallengePage() {
  const router = useRouter();
  const { totpFlow, hasHydrated, completeTotpFlow, user } = useAuthStore();
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    // Wait for the persisted store to rehydrate — otherwise this reads the
    // pre-hydration default (totpFlow: 'none') on every hard reload and
    // wrongly bounces an in-progress challenge back to /login.
    if (!hasHydrated) return;
    if (totpFlow !== 'challenge') {
      router.replace('/login');
    }
  }, [hasHydrated, totpFlow, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TotpCodeInput>({ resolver: zodResolver(totpCodeSchema) });

  const onSubmit = async (data: TotpCodeInput) => {
    setServerError('');
    try {
      const cleanToken = await totpVerify(data.code);
      completeTotpFlow(cleanToken);
      router.replace(user?.current_company_id ? '/' : '/onboarding');
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  return (
    <AuthCard title="Two-factor authentication" subtitle="Enter the 6-digit code from your authenticator app.">
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {serverError && <Alert severity="error">{serverError}</Alert>}

        <TextField
          label="Authentication code"
          placeholder="123456"
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
      </Box>
    </AuthCard>
  );
}
