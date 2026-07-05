'use client';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

interface LoadingOverlayProps {
  label?: string;
  fullPage?: boolean;
}

export default function LoadingOverlay({ label, fullPage }: LoadingOverlayProps) {
  return (
    <Box
      className={`flex flex-col items-center justify-center gap-3 ${fullPage ? 'min-h-screen' : 'py-16'}`}
    >
      <CircularProgress size={24} thickness={3} />
      {label && (
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      )}
    </Box>
  );
}
