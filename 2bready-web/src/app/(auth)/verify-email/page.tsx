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

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const id = searchParams.get('id');
    const hash = searchParams.get('hash');
    const expires = searchParams.get('expires');

    if (!id || !hash) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    api
      .post(`/auth/email/verify/${id}/${hash}`, { expires })
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setMessage(getApiError(err).message);
      });
  }, [searchParams]);

  return (
    <Box className="flex flex-col items-center gap-4 py-4">
      {status === 'loading' && (
        <>
          <CircularProgress />
          <Typography color="text.secondary">Verifying your email…</Typography>
        </>
      )}

      {status === 'success' && (
        <>
          <Alert severity="success" className="w-full">
            Your email has been verified. You can now sign in.
          </Alert>
          <Link href="/login" className="text-blue-600 hover:underline text-sm">
            Go to sign in
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <Alert severity="error" className="w-full">
            {message || 'Verification failed. The link may have expired.'}
          </Alert>
          <Link href="/login" className="text-blue-600 hover:underline text-sm">
            Back to sign in
          </Link>
        </>
      )}
    </Box>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout title="Email verification">
      <Suspense fallback={<Box className="flex justify-center py-8"><CircularProgress /></Box>}>
        <VerifyEmailContent />
      </Suspense>
    </AuthLayout>
  );
}
