'use client';

import Link from 'next/link';
import Button from '@mui/material/Button';

interface GlowButtonProps {
  href: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

export default function GlowButton({ href, children, size = 'large' }: GlowButtonProps) {
  return (
    <Button
      component={Link}
      href={href}
      variant="contained"
      size={size}
      sx={{
        px: 4,
        py: 1.5,
        fontSize: '1rem',
        boxShadow: '0 0 0 1px color-mix(in srgb, var(--mui-palette-primary-main) 15%, transparent), 0 8px 24px -8px color-mix(in srgb, var(--mui-palette-primary-main) 50%, transparent)',
        '&:hover': {
          boxShadow: '0 0 0 1px color-mix(in srgb, var(--mui-palette-primary-main) 25%, transparent), 0 12px 32px -8px color-mix(in srgb, var(--mui-palette-primary-main) 65%, transparent)',
        },
      }}
    >
      {children}
    </Button>
  );
}
