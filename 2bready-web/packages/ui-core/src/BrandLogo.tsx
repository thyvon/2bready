'use client';

import type { ReactNode } from 'react';

export interface BrandLogoProps {
  /**
   * Signed URL from GET /branding/logo. null/undefined renders the
   * fallback (undefined = still loading; null = no platform logo uploaded).
   * The URL is short-lived, so callers should refresh it (see each app's
   * useBrandLogo hook) rather than caching it for the session.
   */
  logoUrl?: string | null;
  /** Shown while loading or when no platform logo is uploaded. */
  fallback: ReactNode;
  /**
   * Maximum HEIGHT in px. The logo is fit inside a height × maxWidth box
   * preserving aspect ratio — a wide wordmark logo gets wide, a square
   * icon logo stays roughly square, neither is ever distorted or cropped.
   */
  height?: number;
  /** Safety cap so an oversized upload never blows a sidebar/navbar layout. */
  maxWidth?: number;
  alt?: string;
  className?: string;
}

// Pure presentational logo slot: renders the platform's uploaded logo
// (business branding, admin-managed) or the app's own fallback mark. Plain
// <img> rather than next/image — the source is a signed temporaryUrl on a
// changing host, so remote-pattern configuration would be a treadmill for
// zero benefit on a tiny header image. Both dimensions auto-fit the box
// (width:auto + max constraints) so the logo scales to fill the allowed
// space instead of being pinned by height alone — a wide logo at height-22
// would otherwise render absurdly small.
export function BrandLogo({ logoUrl, fallback, height = 32, maxWidth = 160, alt = '2bReady', className }: BrandLogoProps) {
  if (!logoUrl) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={logoUrl}
      alt={alt}
      className={className}
      style={{ maxHeight: height, maxWidth, width: 'auto', height: 'auto', objectFit: 'contain', flexShrink: 0 }}
    />
  );
}
