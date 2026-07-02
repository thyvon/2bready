'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
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
      {/* Theme toggle — fixed top-right */}
      <Box sx={{ position: 'fixed', top: 16, right: 16 }}>
        <ThemeToggle />
      </Box>

      {/* Wordmark above card */}
      <Typography
        variant="body1"
        sx={{ fontWeight: 700, letterSpacing: '-0.04em', mb: 5, color: 'text.primary' }}
      >
        2bReady
      </Typography>

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
