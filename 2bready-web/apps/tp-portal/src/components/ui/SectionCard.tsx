'use client';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  noPadding?: boolean;
  className?: string;
}

export default function SectionCard({ children, title, subtitle, action, noPadding, className }: SectionCardProps) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        // Literal px, not the sx numeric shorthand (which multiplies by
        // theme.shape.borderRadius, i.e. `2` here would silently mean 12px, not
        // 2px) — matches MuiCard's own borderRadius token exactly, since this is
        // the app's de facto card component used everywhere. Always check
        // theme/index.ts's actual component override before picking a radius
        // for a new surface; don't eyeball a number that looks fine in isolation.
        borderRadius: '8px',
        bgcolor: 'background.paper',
        overflow: 'hidden',
        // Matches the smooth theme-switch transition MuiPaper/MuiCard already get
        // globally (globals.css) — this is a plain Box, so without this it was the
        // one card-like surface in the app that snapped instantly on theme toggle.
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
      }}
      className={className}
    >
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
    </Box>
  );
}
