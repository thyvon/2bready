'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import AuthLayout from '@/components/layouts/AuthLayout';
import { totpCodeSchema, type TotpCodeInput } from '@/domains/auth/schemas';
import { totpSetup, totpConfirm } from '@/domains/auth/api';
import { useAuthStore } from '@/store/auth.store';
import { getApiError } from '@/lib/utils';
import type { TotpSetupResponse } from '@/domains/auth/types';

export default function TotpSetupPage() {
  const router = useRouter();
  const { totpFlow, setAuth, user, token } = useAuthStore();
  const [setup, setSetup] = useState<TotpSetupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (totpFlow !== 'setup_required') {
      router.replace('/login');
      return;
    }
    totpSetup()
      .then(setSetup)
      .catch(() => setServerError('Failed to load setup. Please try again.'))
      .finally(() => setLoading(false));
  }, [totpFlow, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TotpCodeInput>({ resolver: zodResolver(totpCodeSchema) });

  const onSubmit = async (data: TotpCodeInput) => {
    setServerError('');
    try {
      await totpConfirm(data);
      if (user && token) {
        setAuth(user, token);
      }
      router.replace('/dashboard');
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  return (
    <AuthLayout
      title="Set up two-factor authentication"
      subtitle="Scan the QR code with your authenticator app"
    >
      {loading && (
        <Box className="flex justify-center py-8">
          <CircularProgress />
        </Box>
      )}

      {!loading && serverError && !setup && <Alert severity="error">{serverError}</Alert>}

      {setup && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
          <Box className="flex flex-col items-center gap-4">
            <Image
              src={setup.qr_code_url}
              alt="TOTP QR Code"
              width={200}
              height={200}
              unoptimized
            />
            <Typography variant="caption" color="text.secondary" className="text-center">
              Can&apos;t scan? Enter this key manually:
              <br />
              <strong className="font-mono tracking-widest">{setup.secret}</strong>
            </Typography>
          </Box>

          {serverError && <Alert severity="error">{serverError}</Alert>}

          <TextField
            label="6-digit code from your app"
            inputMode="numeric"
            autoComplete="one-time-code"
            fullWidth
            error={!!errors.code}
            helperText={errors.code?.message}
            {...register('code')}
          />

          <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting}>
            Enable two-factor authentication
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
