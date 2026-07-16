'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import AuthLayout from '@/components/layouts/AuthLayout';
import { resetPasswordSchema, type ResetPasswordInput } from '@/domains/auth/schemas';
import { resetPassword } from '@/domains/auth/api';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import FieldLabel from '@/components/forms/FieldLabel';
import FormTextField from '@/components/forms/FormTextField';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (data: ResetPasswordInput) => {
    setServerError('');
    try {
      await resetPassword(token, email, data);
      router.replace('/login?reset=1');
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  if (!token || !email) {
    return (
      <>
        <Alert severity="error">{t('auth.reset_link_invalid')}</Alert>
        <Typography variant="body2" className="mt-4 text-center">
          <Link href="/forgot-password" className="text-blue-600 hover:underline">
            {t('auth.request_new_one')}
          </Link>
        </Typography>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {serverError && <Alert severity="error">{serverError}</Alert>}

      <Box>
        <FieldLabel>{t('auth.new_password')}</FieldLabel>
        <FormTextField
          placeholder="••••••••"
          type="password"
          autoComplete="new-password"
          autoFocus
          fullWidth
          error={!!errors.password}
          helperText={errors.password?.message}
          {...register('password')}
        />
      </Box>

      <Box>
        <FieldLabel>{t('auth.confirm_new_password')}</FieldLabel>
        <FormTextField
          placeholder="••••••••"
          type="password"
          autoComplete="new-password"
          fullWidth
          error={!!errors.password_confirmation}
          helperText={errors.password_confirmation?.message}
          {...register('password_confirmation')}
        />
      </Box>

      <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting}>
        {t('auth.reset_password_action')}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const { t } = useTranslation();

  return (
    <AuthLayout title={t('auth.reset_title')}>
      <Suspense fallback={<Box className="flex justify-center py-4"><CircularProgress /></Box>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
