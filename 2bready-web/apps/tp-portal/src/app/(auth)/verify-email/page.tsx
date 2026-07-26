'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';

import AuthLayout from '@/components/layouts/AuthLayout';
import api from '@/lib/api';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [apiErrorMessage, setApiErrorMessage] = useState('');

  const id = searchParams.get('id');
  const hash = searchParams.get('hash');
  const linkIsValid = Boolean(id && hash);

  useEffect(() => {
    if (!linkIsValid) return;

    const expires = searchParams.get('expires');

    api
      .post(`/auth/email/verify/${id}/${hash}`, { expires })
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setApiErrorMessage(getApiError(err).message);
      });
  }, [id, hash, linkIsValid, searchParams]);

  if (!linkIsValid) {
    return (
      <Box className="flex flex-col items-center gap-4 py-4">
        <Alert severity="error" className="w-full">
          {t('auth.invalid_verification_link')}
        </Alert>
        <Link href="/login" className="text-blue-600 hover:underline text-sm">
          {t('auth.back_to_sign_in')}
        </Link>
      </Box>
    );
  }

  return (
    <Box className="flex flex-col items-center gap-4 py-4">
      {status === 'loading' && (
        <>
          <CircularProgress />
          <Typography color="text.secondary">{t('auth.verifying_email')}</Typography>
        </>
      )}

      {status === 'success' && (
        <>
          <Alert severity="success" className="w-full">
            {t('auth.email_verified')}
          </Alert>
          <Link href="/login" className="text-blue-600 hover:underline text-sm">
            {t('auth.go_to_sign_in')}
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <Alert severity="error" className="w-full">
            {apiErrorMessage || t('auth.verification_failed')}
          </Alert>
          <Link href="/login" className="text-blue-600 hover:underline text-sm">
            {t('auth.back_to_sign_in')}
          </Link>
        </>
      )}
    </Box>
  );
}

export default function VerifyEmailPage() {
  const { t } = useTranslation();

  return (
    <AuthLayout title={t('auth.verify_email_title')}>
      <Suspense fallback={<Box className="flex justify-center py-8"><CircularProgress /></Box>}>
        <VerifyEmailContent />
      </Suspense>
    </AuthLayout>
  );
}
