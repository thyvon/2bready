'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
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
      <Skeleton variant="circular" width={24} height={24} />
      {label && (
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      )}
    </Box>
  );
}
