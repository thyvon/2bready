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
// Both dimensions auto-fit the box (width:auto + max constraints) so the
// logo scales to fill the allowed space instead of being pinned by height
// alone — a wide wordmark logo would otherwise render absurdly small.
export default function BrandLogo({ logoUrl, fallback, height = 32, maxWidth = 160, alt = '2bReady' }: BrandLogoProps) {
  if (!logoUrl) {
    return <>{fallback}</>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={alt}
      style={{ maxHeight: height, maxWidth, width: 'auto', height: 'auto', objectFit: 'contain', flexShrink: 0 }}
    />
  );
}
