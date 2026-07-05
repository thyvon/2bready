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
import Box from '@mui/material/Box';

import AuthLayout from '@/components/layouts/AuthLayout';
import { registerSchema, type RegisterInput } from '@/domains/auth/schemas';
import { register as registerUser } from '@/domains/auth/api';
import { useAuthStore } from '@/store/auth.store';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import FieldLabel from '@/components/forms/FieldLabel';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth, setPendingTotp } = useAuthStore();
  const { t } = useTranslation();
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
    <AuthLayout title={t('auth.create_account_title')} subtitle={t('auth.create_account_subtitle')}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {serverError && <Alert severity="error">{serverError}</Alert>}

        <Box>
          <FieldLabel>{t('auth.full_name')}</FieldLabel>
          <TextField
            placeholder="e.g. Jane Doe"
            autoComplete="name"
            autoFocus
            fullWidth
            error={!!errors.name}
            helperText={errors.name?.message}
            {...register('name')}
          />
        </Box>

        <Box>
          <FieldLabel>{t('auth.email_address')}</FieldLabel>
          <TextField
            placeholder="you@company.com"
            type="email"
            autoComplete="email"
            fullWidth
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register('email')}
          />
        </Box>

        <Box>
          <FieldLabel>{t('auth.password')}</FieldLabel>
          <TextField
            placeholder="••••••••"
            type="password"
            autoComplete="new-password"
            fullWidth
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register('password')}
          />
        </Box>

        <Box>
          <FieldLabel>{t('auth.confirm_password')}</FieldLabel>
          <TextField
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
          {t('auth.create_account')}
        </Button>

        <Typography variant="body2" color="text.secondary" className="text-center">
          {t('auth.have_account')}{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            {t('auth.sign_in')}
          </Link>
        </Typography>
      </form>
    </AuthLayout>
  );
}
