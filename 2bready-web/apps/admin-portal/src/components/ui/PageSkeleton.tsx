'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

interface PageSkeletonProps {
  /** Number of section cards to render. */
  sections?: number;
  /** Fields per section — each field = a label line + a value line. */
  fieldsPerSection?: number;
  /** Show a breadcrumb/title bar at the top. */
  showHeader?: boolean;
  /** Show a tab bar under the header. */
  tabs?: number;
  /** Show a search/filter bar before sections. */
  showToolbar?: boolean;
}

/**
 * Page-level skeleton that roughly matches the layout of real admin pages:
 * breadcrumb → optional tabs → optional toolbar → section cards with
 * label+value field rows. Pulse animation makes it feel alive.
 */
export default function PageSkeleton({
  sections = 2,
  fieldsPerSection = 4,
  showHeader = true,
  tabs = 0,
  showToolbar = false,
}: PageSkeletonProps) {
  return (
    <Box className="flex flex-col gap-5">
      {/* Breadcrumb + page header */}
      {showHeader && (
        <Box className="flex flex-col gap-2">
          <Skeleton variant="text" width={160} height={16} sx={{ opacity: 0.5 }} />
          <Skeleton variant="text" width={280} height={28} />
          <Skeleton variant="text" width={380} height={14} sx={{ opacity: 0.6 }} />
        </Box>
      )}

      {/* Tab bar */}
      {tabs > 0 && (
        <Box className="flex gap-4" sx={{ borderBottom: 1, borderColor: 'divider', pb: 0 }}>
          {Array.from({ length: tabs }).map((_, i) => (
            <Skeleton key={i} variant="text" width={80 + i * 10} height={36} />
          ))}
        </Box>
      )}

      {/* Toolbar / search / filter bar */}
      {showToolbar && (
        <Box className="flex items-center gap-3">
          <Skeleton variant="rounded" width={240} height={36} sx={{ borderRadius: '8px' }} />
          <Skeleton variant="rounded" width={100} height={36} sx={{ borderRadius: '20px' }} />
          <Skeleton variant="rounded" width={100} height={36} sx={{ borderRadius: '20px' }} />
        </Box>
      )}

      {/* Section cards */}
      {Array.from({ length: sections }).map((_, s) => (
        <Box
          key={s}
          sx={{
            borderRadius: '12px',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          {/* Card header */}
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Skeleton variant="text" width={140 + s * 20} height={18} />
          </Box>
          {/* Card body — field rows */}
          <Box className="p-4" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {Array.from({ length: fieldsPerSection }).map((_, f) => (
              <Box key={f} className="flex items-center gap-3">
                {/* Icon/avatar placeholder */}
                <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: '8px', flexShrink: 0 }} />
                <Box className="flex-1" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Skeleton variant="text" width={70 + (f % 3) * 15} height={12} sx={{ opacity: 0.5 }} />
                  <Skeleton variant="text" width={`${55 + (f % 4) * 10}%`} height={16} />
                </Box>
                {/* Right-side action chip / status badge */}
                <Skeleton variant="rounded" width={64} height={24} sx={{ borderRadius: '12px', flexShrink: 0 }} />
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
