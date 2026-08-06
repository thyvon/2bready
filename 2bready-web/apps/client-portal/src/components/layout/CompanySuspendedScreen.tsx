'use client';

import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { BrandLogo } from '@2bready/ui-core';
import { BrandMark } from './BrandMark';
import { useBrandLogo } from '@/lib/branding';
import { CompanySwitcher } from './CompanySwitcher';
import { useAuthStore } from '@/store/auth.store';
import { logout } from '@/lib/auth-api';
import { useTranslation } from '@/lib/i18n';

interface CompanySuspendedScreenProps {
  companyName: string;
}

// Rendered by PortalAuthGuard *instead of* the portal shell/providers when the
// user's current company isn't active — not a toast, because JourneyProvider
// and PackageProvider both fetch on mount, and a suspended company would
// otherwise produce a stack of near-identical 403 toasts the moment the shell
// mounted. No support-contact link: the Support domain is an empty backend
// scaffold, and only admin/staff/finance can lift a suspension (see
// UpdateCompanyRequest) — there is no self-service reactivation to link to.
export function CompanySuspendedScreen({ companyName }: CompanySuspendedScreenProps) {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { t } = useTranslation();
  const logoUrl = useBrandLogo();

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
          <BrandLogo
            logoUrl={logoUrl}
            height={28}
            maxWidth={140}
            fallback={<BrandMark size={28} />}
          />
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
            bgcolor: 'error.main',
            color: '#fff',
          }}
        >
          <LockOutlinedIcon />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.01em', mb: 1 }}>
          {t('company_suspended.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          {t('company_suspended.body', { company: companyName })}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
          <CompanySwitcher />
        </Box>

        <Button variant="outlined" fullWidth onClick={handleLogout}>
          {t('header.sign_out')}
        </Button>
      </Box>
    </Box>
  );
}
