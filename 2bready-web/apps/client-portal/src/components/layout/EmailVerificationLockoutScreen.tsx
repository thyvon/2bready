'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import { BrandMark } from './BrandMark';
import { useAuthStore } from '@/store/auth.store';
import { logout, resendVerificationEmail } from '@/lib/auth-api';
import { useToast } from '@/components/ToastProvider';
import { useTranslation } from '@/lib/i18n';
import { getApiError } from '@2bready/api-client';

interface EmailVerificationLockoutScreenProps {
  email: string;
}

// Rendered by PortalAuthGuard *instead of* the portal shell/providers for a
// password-registered account that hasn't clicked its verification link yet
// — mirrors CompanySuspendedScreen's pattern (full-page block, not a toast,
// since the shell's own data providers would otherwise 403 the moment they
// mounted). Google-linked accounts never hit this — HandleGoogleCallbackAction
// stamps email_verified_at at creation/link time.
export function EmailVerificationLockoutScreen({ email }: EmailVerificationLockoutScreenProps) {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const toast = useToast();
  const { t } = useTranslation();
  const [sending, setSending] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Token may already be invalid/expired server-side — clear local
      // state regardless, the goal is "get the user logged out locally."
    }
    clearAuth();
    router.push('/login');
  };

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerificationEmail();
      toast.success(t('email_verification.resent'));
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, md: 4 },
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 420,
          textAlign: 'center',
          p: { xs: 4, sm: 5 },
          borderRadius: '24px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: '0 24px 64px -16px rgba(0,0,0,0.25)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <BrandMark size={28} />
        </Box>

        <Box
          sx={{
            width: 56,
            height: 56,
            mx: 'auto',
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '16px',
            bgcolor: 'warning.main',
            color: '#fff',
          }}
        >
          <MarkEmailUnreadOutlinedIcon />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.01em', mb: 1 }}>
          {t('email_verification.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          {t('email_verification.body', { email })}
        </Typography>

        <Button variant="contained" fullWidth loading={sending} onClick={handleResend} sx={{ mb: 1.5 }}>
          {t('email_verification.resend')}
        </Button>
        <Button variant="outlined" fullWidth onClick={handleLogout}>
          {t('header.sign_out')}
        </Button>
      </Box>
    </Box>
  );
}
