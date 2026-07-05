'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

export interface LoadingStateProps {
  /** Number of skeleton rows to render. */
  rows?: number;
}

// Skeleton-based, not a spinner overlay — a spinner blocks the layout from
// being perceived at all, which reads as slower than it is; skeletons show
// the shape of the content immediately and feel faster even at equal load time.
export function LoadingState({ rows = 3 }: LoadingStateProps) {
  return (
    <Box className="flex flex-col gap-3 py-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={56} />
      ))}
    </Box>
  );
}
