'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { BrandMark } from '@/components/layout/BrandMark';
import { CompanySetupWizard } from '@/components/onboarding/CompanySetupWizard';
import type { CompanySetupOutput } from '@/lib/company-setup-schema';
import { registerOwnCompany } from '@/lib/company-api';
import { useAuthStore } from '@/store/auth.store';

// Deliberately outside app/(portal) — a brand-new company hasn't set up
// their profile yet, so they shouldn't see the full nav (Journey, Audits,
// Billing, ...) before it exists. See app/(portal)/layout.tsx and the root
// app/layout.tsx for how this opts out of PortalShell.
//
// Requires an authenticated session — account creation happens on the
// separate /register page (kept distinct because a company_owner can
// register more than one company over time, so "create my account" and
// "create a company" have to stay independently reusable steps).
export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace('/register');
    }
  }, [hasHydrated, isAuthenticated, router]);

  const handleComplete = async (data: CompanySetupOutput) => {
    await registerOwnCompany({
      name: data.name,
      name_kh: data.name_kh || undefined,
      registration_no: data.registration_no || undefined,
      industry_id: data.industry_id,
      country_code: data.country_code,
    });
    router.push('/');
  };

  // Waiting on localStorage rehydration (or the redirect above to fire) — an
  // unauthenticated flash of the wizard itself would be worse than a spinner.
  if (!hasHydrated || !isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 6,
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      {/* A quiet radial glow behind the card, same blue as every other glow
          accent in the app (GlowButton, unlocked JourneyTree nodes) — this is
          the very first screen a company sees, so it should already look
          like the product, not a bare form on a gray background. */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 900,
          height: 900,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, color-mix(in srgb, var(--mui-palette-primary-main) 8%, transparent) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ width: '100%', maxWidth: 480, position: 'relative' }}>
        <Box className="flex flex-col items-center" sx={{ mb: 4, textAlign: 'center' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '16px',
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow:
                '0 0 0 1px color-mix(in srgb, var(--mui-palette-primary-main) 10%, transparent), 0 8px 24px -8px color-mix(in srgb, var(--mui-palette-primary-main) 35%, transparent)',
            }}
          >
            <BrandMark size={28} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.01em', mt: 2.5 }}>
            Set up your company profile
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 360 }}>
            A few basics before you enter your Trust Journey — this determines which compliance pathway applies to
            your company.
          </Typography>
        </Box>

        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '16px',
            bgcolor: 'background.paper',
            boxShadow: '0 12px 40px -12px rgba(0, 0, 0, 0.12)',
            p: { xs: 3, sm: 4 },
          }}
        >
          <CompanySetupWizard onComplete={handleComplete} />
        </Box>
      </Box>
    </Box>
  );
}
