'use client';

import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';

export interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  noPadding?: boolean;
  className?: string;
  /** Opt-in override merged onto the root Card — e.g. a page that wants every card to share one hover treatment. Other callers are unaffected. */
  sx?: SxProps<Theme>;
}

// Builds on MUI's themed Card rather than re-declaring border/radius/background
// on a plain Box — the shell's shape comes from one place (each app's MuiCard
// theme override), so it can't drift out of sync with plain <Card> usage elsewhere.
export function SectionCard({ children, title, subtitle, action, noPadding, className, sx }: SectionCardProps) {
  return (
    <Card sx={{ overflow: 'hidden', ...sx }} className={className}>
      {(title || action) && (
        <>
          <Box className="flex items-center justify-between gap-4 px-4 py-3">
            <Box>
              {title && (
                <Typography variant="h6" component="h2">
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            {action && <Box className="shrink-0">{action}</Box>}
          </Box>
          <Divider />
        </>
      )}
      <Box className={noPadding ? '' : 'p-4'}>{children}</Box>
    </Card>
  );
}
