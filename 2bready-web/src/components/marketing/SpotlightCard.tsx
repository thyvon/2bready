'use client';

import { useRef } from 'react';
import Box from '@mui/material/Box';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

const MAX_TILT = 8; // degrees

export default function SpotlightCard({ children, className }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    el.style.setProperty('--spot-x', `${x}px`);
    el.style.setProperty('--spot-y', `${y}px`);

    const px = x / rect.width;   // 0 → 1
    const py = y / rect.height;  // 0 → 1
    const rotateY = (px - 0.5) * MAX_TILT * 2;
    const rotateX = (0.5 - py) * MAX_TILT * 2;

    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)';
  };

  return (
    <Box
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      sx={{
        position: 'relative',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '16px',
        bgcolor: 'background.paper',
        p: 4,
        overflow: 'hidden',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        transition: 'transform 0.15s ease-out, border-color 0.3s ease',
        '&:hover': {
          borderColor: 'var(--2br-border-hover)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          background: 'radial-gradient(320px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(0,112,243,0.12), transparent 70%)',
          opacity: 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
        },
        '&:hover::before': { opacity: 1 },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1, transform: 'translateZ(20px)' }}>{children}</Box>
    </Box>
  );
}