'use client';

import { useRef } from 'react';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  tilt?: boolean;
  sx?: SxProps<Theme>;
}

export default function SpotlightCard({ children, className, tilt = true, sx }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    el.style.setProperty('--spot-x', `${x}px`);
    el.style.setProperty('--spot-y', `${y}px`);

    el.style.transition = 'transform 0.15s ease-out';

    // Flat 2D lift only — no perspective/rotation. Any 3D transform keeps
    // the card (and its text) on a composited 3D layer where glyphs can
    // rasterize at sub-pixel positions and look blurry.
    if (tilt) {
      el.style.transform = 'translateY(-6px)';
    } else {
      el.style.transform = 'translateY(-4px)';
    }
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
    // Clear the transform entirely so the element returns to natural layout
    // rendering (no lingering compositor layer).
    el.style.transform = '';
  };

  return (
    <Box
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      sx={[
        {
          position: 'relative',
          borderRadius: '20px',
          bgcolor: 'background.paper',
          p: 4,
          overflow: 'hidden',
          boxShadow:
            '0 1px 2px rgba(16,24,40,0.05), 0 4px 12px rgba(16,24,40,0.06), 0 16px 40px -12px rgba(16,24,40,0.14)',
          transition: 'transform 0.15s ease-out, box-shadow 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow:
              '0 2px 4px rgba(16,24,40,0.06), 0 8px 24px rgba(16,24,40,0.08), 0 24px 56px -12px rgba(113,183,124,0.3), 0 0 24px -6px rgba(113,183,124,0.18)',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: 'radial-gradient(320px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(113,183,124,0.12), transparent 70%)',
            opacity: 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
          },
          '&:hover::before': { opacity: 1 },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {children}
      </Box>
    </Box>
  );
}