'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import AuthLayout from '@/components/layouts/AuthLayout';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/domains/auth/schemas';
import { forgotPassword } from '@/domains/auth/api';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import FieldLabel from '@/components/forms/FieldLabel';
import FormTextField from '@/components/forms/FormTextField';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
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
      <AuthLayout title={t('auth.check_email_title')} subtitle={t('auth.check_email_subtitle')}>
        <Alert severity="success" className="mb-4">
          {t('auth.check_email_body')}
        </Alert>
        <Link href="/login" className="text-blue-600 hover:underline text-sm">
          {t('auth.back_to_sign_in')}
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t('auth.forgot_title')} subtitle={t('auth.forgot_subtitle')}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {serverError && <Alert severity="error">{serverError}</Alert>}

        <Box>
          <FieldLabel>{t('auth.email_address')}</FieldLabel>
          <FormTextField
            placeholder="you@company.com"
            type="email"
            autoComplete="email"
            autoFocus
            fullWidth
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register('email')}
          />
        </Box>

        <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting}>
          {t('auth.send_reset_link')}
        </Button>

        <Typography variant="body2" color="text.secondary" className="text-center">
          <Link href="/login" className="text-blue-600 hover:underline">
            {t('auth.back_to_sign_in')}
          </Link>
        </Typography>
      </form>
    </AuthLayout>
  );
}
