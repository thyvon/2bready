'use client';

import Box from '@mui/material/Box';
import Link from 'next/link';
import type { SxProps, Theme } from '@mui/material/styles';

export interface NavHoverLinkProps {
  href: string;
  label: string;
  active?: boolean;
  sx?: SxProps<Theme>;
  onClick?: () => void;
}

// Vertical "roll-up" hover animation: the current label slides up and out
// while a duplicate label slides up from below to take its place.
export function NavHoverLink({ href, label, active, sx, onClick }: NavHoverLinkProps) {
  return (
    <Box
      component={Link}
      href={href}
      onClick={onClick}
      className="nav-hover-link"
      sx={{
        position: 'relative',
        display: 'inline-block',
        overflow: 'hidden',
        height: '1.4em',
        lineHeight: '1.4em',
        textDecoration: 'none',
        color: active ? 'text.primary' : 'text.secondary',
        fontSize: 'inherit',
        fontWeight: active ? 600 : 'inherit',
        verticalAlign: 'top',
        ...sx,
      }}
    >
      <Box
        className="nav-hover-link-track"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.45s cubic-bezier(0.65, 0, 0.35, 1)',
          transform: 'translateY(0%)',
          '.nav-hover-link:hover &': {
            transform: 'translateY(-50%)',
          },
        }}
      >
        <Box component="span" sx={{ height: '1.4em', lineHeight: '1.4em' }}>
          {label}
        </Box>
        <Box component="span" sx={{ height: '1.4em', lineHeight: '1.4em', color: 'text.primary' }}>
          {label}
        </Box>
      </Box>
    </Box>
  );
}
