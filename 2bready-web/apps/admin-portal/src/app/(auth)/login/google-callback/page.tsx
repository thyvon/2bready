'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

import AuthLayout from '@/components/layouts/AuthLayout';
import { googleAuthExchange } from '@/domains/auth/api';
import { completeLogin } from '@/domains/auth/helpers';
import { useAuthStore } from '@/store/auth.store';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, setPendingTotp } = useAuthStore();
  const { t } = useTranslation();
  const [error, setError] = useState('');
  // The exchange code is one-time-use server-side — Strict Mode's double-invoke
  // of effects in dev would otherwise burn it on the first (discarded) call and
  // 403 on the real one.
  const exchanged = useRef(false);

  const code = searchParams.get('code');
  // Google itself rejected the sign-in (e.g. account disabled for Google
  // auth) — this is already known synchronously from the URL, no effect
  // needed to surface it.
  const googleError = searchParams.get('google_error');

  useEffect(() => {
    if (googleError || !code || exchanged.current) return;
    exchanged.current = true;

    googleAuthExchange(code)
      .then((res) => completeLogin(res, router, { setAuth, setPendingTotp }))
      .catch((err) => setError(getApiError(err).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, googleError]);

  const displayError = googleError || error;

  if (displayError) {
    return (
      <Box className="flex flex-col items-center gap-4 py-4">
        <Alert severity="error" className="w-full">{displayError}</Alert>
        <Link href="/login" className="text-blue-600 hover:underline text-sm">
          {t('auth.back_to_sign_in')}
        </Link>
      </Box>
    );
  }

  return (
    <Box className="flex flex-col items-center gap-4 py-8">
      <CircularProgress />
    </Box>
  );
}

export default function GoogleCallbackPage() {
  const { t } = useTranslation();

  return (
    <AuthLayout title={t('auth.sign_in')}>
      <Suspense fallback={<Box className="flex justify-center py-8"><CircularProgress /></Box>}>
        <GoogleCallbackContent />
      </Suspense>
    </AuthLayout>
  );
}
