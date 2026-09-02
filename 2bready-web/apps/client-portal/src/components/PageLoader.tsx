'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

/**
 * Shared loading skeleton for every data-driven page in client-portal.
 * Matches the real page structure: header block → summary cards → main
 * content area. Pulse animation keeps it feeling alive during loading.
 */
export function PageLoader() {
  return (
    <Box className="flex flex-col gap-6">
      {/* Header / hero block */}
      <Box
        sx={{
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'divider',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        <Skeleton variant="text" width={180} height={14} sx={{ opacity: 0.5 }} />
        <Skeleton variant="text" width={300} height={28} />
        <Skeleton variant="text" width={420} height={14} sx={{ opacity: 0.6 }} />
      </Box>

      {/* Summary cards row */}
      <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'divider',
              p: 2.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Skeleton variant="text" width={100} height={12} sx={{ opacity: 0.5 }} />
            <Skeleton variant="text" width={60} height={32} />
            <Skeleton variant="text" width={140} height={12} sx={{ opacity: 0.4 }} />
          </Box>
        ))}
      </Box>

      {/* Main content area — two sections stacked */}
      <Box
        sx={{
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Skeleton variant="text" width={160} height={18} />
        </Box>
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Box key={i} className="flex items-center gap-3">
              <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: '8px', flexShrink: 0 }} />
              <Box className="flex-1" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Skeleton variant="text" width={70 + (i % 3) * 15} height={12} sx={{ opacity: 0.5 }} />
                <Skeleton variant="text" width={`${55 + (i % 4) * 10}%`} height={16} />
              </Box>
              <Skeleton variant="rounded" width={64} height={24} sx={{ borderRadius: '12px', flexShrink: 0 }} />
            </Box>
          ))}
        </Box>
      </Box>

      <Box
        sx={{
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Skeleton variant="text" width={120} height={18} />
        </Box>
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Box key={i} className="flex items-center gap-3">
              <Skeleton variant="circular" width={32} height={32} sx={{ flexShrink: 0 }} />
              <Box className="flex-1" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Skeleton variant="text" width={90 + (i % 2) * 20} height={12} sx={{ opacity: 0.5 }} />
                <Skeleton variant="text" width={`${60 + (i % 3) * 10}%`} height={16} />
              </Box>
              <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '12px', flexShrink: 0 }} />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
