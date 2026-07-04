'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InboxIcon from '@mui/icons-material/Inbox';
import { useTranslation } from '@/lib/i18n';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export default function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <Box className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
      <Box sx={{ color: 'text.disabled', fontSize: 40 }}>
        {icon ?? <InboxIcon fontSize="inherit" />}
      </Box>
      <Box>
        <Typography variant="h6" color="text.primary">
          {title ?? t('common.no_results')}
        </Typography>
        <Typography variant="body2" color="text.secondary" className="mt-1">
          {description ?? t('common.nothing_here')}
        </Typography>
      </Box>
      {action && <Box className="mt-2">{action}</Box>}
    </Box>
  );
}
