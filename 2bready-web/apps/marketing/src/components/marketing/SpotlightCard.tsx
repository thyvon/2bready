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

const MAX_TILT = 8; 

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

    el.style.transition = 'transform 0.08s linear';

    if (tilt) {
      const px = x / rect.width;   
      const py = y / rect.height;  
      const rotateY = (px - 0.5) * MAX_TILT * 2;
      const rotateX = (0.5 - py) * MAX_TILT * 2;
      el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    } else {
      el.style.transform = 'translateY(-4px)'; 
    }
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
    el.style.transform = tilt
      ? 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)'
      : 'translateY(0)';
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
          transformStyle: 'preserve-3d',
          willChange: 'transform',
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
      <Box sx={{ position: 'relative', zIndex: 1, transform: 'translateZ(20px)', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {children}
      </Box>
    </Box>
  );
}