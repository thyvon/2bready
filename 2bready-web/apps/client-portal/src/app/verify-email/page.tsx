'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { AuthCard } from '@/components/layout/AuthCard';
import { verifyEmail } from '@/lib/auth-api';
import { getApiError } from '@2bready/api-client';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [apiErrorMessage, setApiErrorMessage] = useState('');

  const id = searchParams.get('id');
  const hash = searchParams.get('hash');
  const expires = searchParams.get('expires');
  const linkIsValid = Boolean(id && hash && expires);

  useEffect(() => {
    if (!linkIsValid || !id || !hash || !expires) return;

    verifyEmail(id, hash, expires)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setApiErrorMessage(getApiError(err).message);
      });
  }, [id, hash, expires, linkIsValid]);

  if (!linkIsValid) {
    return (
      <Box className="flex flex-col items-center gap-4">
        <Alert severity="error" className="w-full">Invalid verification link.</Alert>
        <MuiLink component={Link} href="/login" underline="hover" variant="body2">
          Back to sign in
        </MuiLink>
      </Box>
    );
  }

  return (
    <Box className="flex flex-col items-center gap-4">
      {status === 'loading' && (
        <>
          <CircularProgress />
          <Typography color="text.secondary">Verifying your email…</Typography>
        </>
      )}

      {status === 'success' && (
        <>
          <Alert severity="success" className="w-full">Your email has been verified. You can now sign in.</Alert>
          <MuiLink component={Link} href="/login" underline="hover" variant="body2">
            Go to sign in
          </MuiLink>
        </>
      )}

      {status === 'error' && (
        <>
          <Alert severity="error" className="w-full">{apiErrorMessage || 'Verification failed. The link may have expired.'}</Alert>
          <MuiLink component={Link} href="/login" underline="hover" variant="body2">
            Back to sign in
          </MuiLink>
        </>
      )}
    </Box>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthCard title="Email verification">
      <Suspense fallback={<Box className="flex justify-center py-8"><CircularProgress /></Box>}>
        <VerifyEmailContent />
      </Suspense>
    </AuthCard>
  );
}
