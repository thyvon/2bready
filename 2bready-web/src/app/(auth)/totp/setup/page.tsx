'use client';

import { useEffect, useRef, useState } from 'react';
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
import { useTranslation } from '@/lib/i18n';
import FieldLabel from '@/components/forms/FieldLabel';
import type { TotpSetupResponse } from '@/domains/auth/types';

export default function TotpSetupPage() {
  const router = useRouter();
  const { totpFlow, setAuth, user } = useAuthStore();
  const { t } = useTranslation();
  const [setup, setSetup] = useState<TotpSetupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');
  // Generating a TOTP secret is not idempotent — each call overwrites the
  // stored secret, so React Strict Mode's dev-mode double-invoke of this
  // effect would otherwise race two secrets against each other and show the
  // user a QR code that doesn't match what's actually stored for verification.
  const hasRequestedSetup = useRef(false);

  useEffect(() => {
    if (totpFlow !== 'setup_required') {
      router.replace('/login');
      return;
    }
    if (hasRequestedSetup.current) return;
    hasRequestedSetup.current = true;

    totpSetup()
      .then(setSetup)
      .catch(() => setServerError(t('auth.totp_setup_failed')))
      .finally(() => setLoading(false));
  }, [totpFlow, router, t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TotpCodeInput>({ resolver: zodResolver(totpCodeSchema) });

  const onSubmit = async (data: TotpCodeInput) => {
    setServerError('');
    try {
      // The token returned here is a fresh, fully-capable one — the token held since
      // login only carries the restricted 'totp-pending' ability and cannot reach the
      // dashboard's API calls once we navigate past this page.
      const newToken = await totpConfirm(data);
      if (user) {
        setAuth(user, newToken);
      }
      router.replace('/dashboard');
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  return (
    <AuthLayout
      title={t('auth.totp_setup_title')}
      subtitle={t('auth.totp_setup_subtitle')}
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
              {t('auth.totp_manual_key')}
              <br />
              <strong className="font-mono tracking-widest">{setup.secret}</strong>
            </Typography>
          </Box>

          {serverError && <Alert severity="error">{serverError}</Alert>}

          <Box>
            <FieldLabel>{t('auth.totp_code_label')}</FieldLabel>
            <TextField
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              fullWidth
              error={!!errors.code}
              helperText={errors.code?.message}
              {...register('code')}
            />
          </Box>

          <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting}>
            {t('auth.totp_enable')}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
