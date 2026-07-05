'use client';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

export interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  noPadding?: boolean;
  className?: string;
}

export function SectionCard({ children, title, subtitle, action, noPadding, className }: SectionCardProps) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        overflow: 'hidden',
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
