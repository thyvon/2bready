'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

// One shared loading shape reused identically across every data-driven page
// in client-portal (Overview, Journey, Data Room, SOPs, Trust Badge,
// Billing) — a wide top block + a 3-column card row + one tall block. Not
// tailored per page on purpose: the point is that "the app is loading"
// looks and feels the same everywhere, not a different bespoke skeleton per
// route. Skeleton-based rather than a spinner, matching ui-core's own
// LoadingState reasoning — it reads as "the content is arriving," not a
// blank stall.
export function PageLoader() {
  return (
    <Box className="flex flex-col gap-6">
      <Skeleton variant="rounded" height={160} />
      <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={140} />
        ))}
      </Box>
      <Skeleton variant="rounded" height={280} />
    </Box>
  );
}
