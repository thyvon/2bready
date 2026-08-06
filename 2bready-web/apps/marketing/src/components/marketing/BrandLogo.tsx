'use client';

import type { ReactNode } from 'react';

interface BrandLogoProps {
  logoUrl?: string | null;
  fallback: ReactNode;
  height?: number;
  maxWidth?: number;
  alt?: string;
}

// Presentational logo slot (marketing doesn't depend on @2bready/ui-core):
// renders the platform's uploaded logo or the app's own mark. Plain <img> —
// the source is a signed temporaryUrl, not a next/image-friendly static host.
export default function BrandLogo({ logoUrl, fallback, height = 24, maxWidth = 160, alt = '2bReady' }: BrandLogoProps) {
  if (!logoUrl) {
    return <>{fallback}</>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={alt}
      style={{ height, maxWidth, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
    />
  );
}
