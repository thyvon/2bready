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
  /** Height in px — logos are typically wide, so width follows aspect. */
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
// zero benefit on a tiny header image.
export function BrandLogo({ logoUrl, fallback, height = 24, maxWidth = 160, alt = '2bReady', className }: BrandLogoProps) {
  if (!logoUrl) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={logoUrl}
      alt={alt}
      className={className}
      style={{ height, maxWidth, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
    />
  );
}
