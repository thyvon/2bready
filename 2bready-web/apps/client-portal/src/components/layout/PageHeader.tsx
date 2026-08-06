'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// Admin-portal-style page header for the client portal: replaces the
// hand-rolled caption + h5 + description blocks so every page opens with the
// same composed header, then cards. The optional `action` slot carries the
// page's primary control (search field, CTA button) — mirrored on the right
// like admin's PageHeader action.
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, eyebrow, action }: PageHeaderProps) {
  return (
    <Box className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <Box className="min-w-0">
        {eyebrow && (
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'primary.main' }}
          >
            {eyebrow}
          </Typography>
        )}
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.01em', mt: eyebrow ? 0.5 : 0 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 640 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box className="shrink-0">{action}</Box>}
    </Box>
  );
}
