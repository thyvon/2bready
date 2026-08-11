'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { BrandLogo } from '@2bready/ui-core';
import { BrandMark } from './BrandMark';
import { useThemeBrandLogo } from '@/lib/branding';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

// A lighter single-panel counterpart to login/register's full 2-column aurora
// layout — for the quick functional continuation steps of the auth flow
// (TOTP setup/challenge, the Google OAuth callback bridge, email-verification
// lockout) rather than a marketing moment. Mirrors CompanySuspendedScreen's
// centered-card shape from the same app.
export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  const logoUrl = useThemeBrandLogo();

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
            height={40}
            maxWidth={200}
            fallback={<BrandMark size={28} />}
          />
        </Box>

        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {children}
      </Box>
    </Box>
  );
}
