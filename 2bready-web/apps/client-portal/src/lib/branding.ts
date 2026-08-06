import { useEffect, useState } from 'react';
import api from './api';

// Platform logo (business branding, admin-managed) for every portal's
// nav/footer. The backend hands back a SHORT-LIVED signed URL (10 min), so
// we never cache it for the session: refresh on mount once the cache is
// stale (4 min — comfortably under the signed expiry), so a long-lived
// dashboard session never shows a dead image.
let cachedLogoUrl: string | null | undefined;
let cachedAt = 0;

const CACHE_TTL_MS = 4 * 60 * 1000;

async function fetchLogoUrl(): Promise<string | null> {
  try {
    const res = await api.get<{ data: { url: string | null } }>('/branding/logo');
    return res.data.data?.url ?? null;
  } catch {
    return null;
  }
}

export function useBrandLogo(): string | null | undefined {
  const [url, setUrl] = useState<string | null | undefined>(cachedLogoUrl);

  useEffect(() => {
    if (Date.now() - cachedAt < CACHE_TTL_MS) return;
    let active = true;
    void fetchLogoUrl().then((next) => {
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
