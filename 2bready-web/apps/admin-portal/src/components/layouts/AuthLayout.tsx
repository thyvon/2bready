'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { BrandLogo } from '@2bready/ui-core';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageSwitcher from '@/components/layouts/LanguageSwitcher';
import { useBrandLogoForTheme } from '@/domains/branding/hooks';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const logoUrl = useBrandLogoForTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'var(--2br-auth-bg)',
        px: 2,
        py: 8,
      }}
    >
      {/* Language switcher + theme toggle — fixed top-right */}
      <Box sx={{ position: 'fixed', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <LanguageSwitcher />
        <ThemeToggle />
      </Box>

      {/* Platform logo above card */}
      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'center' }}>
        <BrandLogo
          logoUrl={logoUrl}
          height={28}
          maxWidth={160}
          fallback={<Box sx={{ width: 20, height: 20, borderRadius: '5px', bgcolor: 'text.primary' }} />}
        />
      </Box>

      {/* Auth card */}
      <Paper
        variant="outlined"
        sx={{
          width: '100%',
          maxWidth: 400,
          p: '32px',
          borderRadius: '12px',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h3" sx={{ fontWeight: 600, letterSpacing: '-0.02em', mb: 0.5 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>

        {children}
      </Paper>
    </Box>
  );
}
