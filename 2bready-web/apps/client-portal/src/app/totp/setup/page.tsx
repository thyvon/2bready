'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { AuthCard } from '@/components/layout/AuthCard';
import FormTextField from '@/components/forms/FormTextField';
import { totpCodeSchema, type TotpCodeInput } from '@/lib/totp-code-schema';
import { totpSetup, totpConfirm, type TotpSetupResult } from '@/lib/auth-api';
import { useAuthStore } from '@/store/auth.store';
import { getApiError } from '@2bready/api-client';

export default function TotpSetupPage() {
  const router = useRouter();
  const { totpFlow, hasHydrated, setAuth, user } = useAuthStore();
  const [setup, setSetup] = useState<TotpSetupResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');
  // Generating a TOTP secret is not idempotent — each call overwrites the
  // stored secret, so React Strict Mode's dev-mode double-invoke of this
  // effect would otherwise race two secrets against each other and show a QR
  // code that doesn't match what's actually stored for verification.
  const hasRequestedSetup = useRef(false);

  useEffect(() => {
    // Wait for the persisted store to rehydrate — otherwise this reads the
    // pre-hydration default (totpFlow: 'none') on every hard reload and
    // wrongly bounces an in-progress setup back to /login.
    if (!hasHydrated) return;
    if (totpFlow !== 'setup_required') {
      router.replace('/login');
      return;
    }
    if (hasRequestedSetup.current) return;
    hasRequestedSetup.current = true;

    totpSetup()
      .then(setSetup)
      .catch(() => setServerError('Could not start two-factor setup. Please try again.'))
      .finally(() => setLoading(false));
  }, [hasHydrated, totpFlow, router]);

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
      // portal's API calls once we navigate past this page.
      const newToken = await totpConfirm(data.code);
      if (user) setAuth(user, newToken);
      router.replace(user?.current_company_id ? '/' : '/onboarding');
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  return (
    <AuthCard title="Set up two-factor authentication" subtitle="Scan the QR code with your authenticator app.">
      {loading && (
        <Box className="flex justify-center py-8">
          <CircularProgress />
        </Box>
      )}

      {!loading && serverError && !setup && <Alert severity="error">{serverError}</Alert>}

      {setup && (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box className="flex flex-col items-center gap-4">
            <Image src={setup.qr_code_url} alt="TOTP QR Code" width={200} height={200} unoptimized />
            <Typography variant="caption" color="text.secondary" className="text-center">
              Or enter this key manually:
              <br />
              <strong className="font-mono tracking-widest">{setup.secret}</strong>
            </Typography>
          </Box>

          {serverError && <Alert severity="error">{serverError}</Alert>}

          <FormTextField
            label="Authentication code"
            placeholder="123456"
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
        </Box>
      )}
    </AuthCard>
  );
}
