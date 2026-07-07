'use client';

import Link from 'next/link';
import Button from '@mui/material/Button';

export interface GlowButtonProps {
  /** Renders as a navigation link when set. Omit for an action button (form submit, onClick handler). */
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

// Padding/font-size actually vary by size — previously hardcoded regardless
// of the `size` prop, so small/medium silently rendered identical to large.
const SIZE_STYLES = {
  small: { px: 2.5, py: 0.75, fontSize: '0.8125rem' },
  medium: { px: 3, py: 1, fontSize: '0.875rem' },
  large: { px: 4, py: 1.5, fontSize: '1rem' },
} as const;

// Same glow treatment either as a Link (navigation) or a plain button (form
// actions) — previously link-only, which pushed anything that needed
// onClick/type="submit" (a wizard's Next/Submit button, say) into hand-rolling
// the box-shadow recipe again instead of reusing this component.
export function GlowButton({ href, onClick, type = 'button', disabled, children, size = 'large' }: GlowButtonProps) {
  const linkProps = href ? { component: Link, href } : { type };
  return (
    <Button
      {...linkProps}
      onClick={onClick}
      disabled={disabled}
      variant="contained"
      size={size}
      sx={{
        ...SIZE_STYLES[size],
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
