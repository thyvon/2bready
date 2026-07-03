'use client';

import { useRef } from 'react';
import Box from '@mui/material/Box';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function SpotlightCard({ children, className }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  };

  return (
    <Box
      ref={ref}
      onMouseMove={handleMouseMove}
      className={className}
      sx={{
        position: 'relative',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '16px',
        bgcolor: 'background.paper',
        p: 4,
        overflow: 'hidden',
        transition: 'transform 0.3s ease, border-color 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
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
      <Box sx={{ position: 'relative', zIndex: 1 }}>{children}</Box>
    </Box>
  );
}
