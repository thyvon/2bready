import { useEffect, useState } from 'react';
import { getBrandLogoUrl } from './api';

// Platform logo (business branding, admin-managed) for the sidebar. The
// backend hands back a SHORT-LIVED signed URL (10 min), so we never cache
// it for the session: refresh on mount once the cache is stale (4 min —
// comfortably under the signed expiry), so a long-lived dashboard session
// never shows a dead image.
let cachedLogoUrl: string | null | undefined;
let cachedAt = 0;

const CACHE_TTL_MS = 4 * 60 * 1000;

export function useBrandLogo(): string | null | undefined {
  const [url, setUrl] = useState<string | null | undefined>(cachedLogoUrl);

  useEffect(() => {
    if (Date.now() - cachedAt < CACHE_TTL_MS) return;
    let active = true;
    void getBrandLogoUrl().then((next) => {
      if (!active) return;
      cachedLogoUrl = next;
      cachedAt = Date.now();
      setUrl(next);
    });
    return () => {
      active = false;
    };
  }, []);

  return url;
}
