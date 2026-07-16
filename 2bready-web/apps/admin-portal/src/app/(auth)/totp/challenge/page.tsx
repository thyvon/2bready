'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';

import AuthLayout from '@/components/layouts/AuthLayout';
import { totpCodeSchema, type TotpCodeInput } from '@/domains/auth/schemas';
import { totpVerify } from '@/domains/auth/api';
import { useAuthStore } from '@/store/auth.store';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import FieldLabel from '@/components/forms/FieldLabel';
import FormTextField from '@/components/forms/FormTextField';

export default function TotpChallengePage() {
  const router = useRouter();
  const { totpFlow, hasHydrated, completeTotpFlow } = useAuthStore();
  const { t } = useTranslation();
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
      const cleanToken = await totpVerify(data);
      completeTotpFlow(cleanToken);
      router.replace('/dashboard');
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  return (
    <AuthLayout
      title={t('auth.totp_challenge_title')}
      subtitle={t('auth.totp_challenge_subtitle')}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {serverError && <Alert severity="error">{serverError}</Alert>}

        <Box>
          <FieldLabel>{t('auth.totp_auth_code')}</FieldLabel>
          <FormTextField
            placeholder="123456"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            fullWidth
            error={!!errors.code}
            helperText={errors.code?.message}
            {...register('code')}
          />
        </Box>

        <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting}>
          {t('auth.verify')}
        </Button>
      </form>
    </AuthLayout>
  );
}
