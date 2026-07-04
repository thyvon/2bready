'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <Box className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
      <Box>
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" className="mt-1">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box className="shrink-0">{action}</Box>}
    </Box>
  );
}
