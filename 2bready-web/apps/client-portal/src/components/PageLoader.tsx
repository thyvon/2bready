'use client';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

/**
 * Full-page loading indicator — centered spinner that blocks the page
 * while data loads. Used instead of skeleton placeholders for a cleaner,
 * consistent loading experience across all pages.
 */
export function PageLoader() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <CircularProgress size={32} />
    </Box>
  );
}
