'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';

export interface ErrorStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function ErrorState({ title, description, action }: ErrorStateProps) {
  return (
    <Box className="flex flex-col items-center justify-center py-10 px-6 text-center gap-3">
      <Box sx={{ color: 'error.main', fontSize: 40 }}>
        <ErrorOutlineIcon fontSize="inherit" />
      </Box>
      <Box>
        <Typography variant="h6" color="text.primary">
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" className="mt-1">
            {description}
          </Typography>
        )}
      </Box>
      {action && <Box className="mt-2">{action}</Box>}
    </Box>
  );
}
