import { useEffect, useState } from 'react';
import { useColorScheme } from '@mui/material/styles';
import api from './api';

// The four branding slots the platform supports (two placements × two
// theme modes). `light` is the historic single-logo slot — the backend
// keeps its original setting key, so existing installs need no migration.
export type BrandLogoVariant = 'light' | 'dark' | 'footer' | 'footerDark';

export interface BrandingSlots {
  light: string | null;
  dark: string | null;
  footer: string | null;
  footerDark: string | null;
}

async function fetchBranding(): Promise<BrandingSlots> {
  try {
    const res = await api.get<{ data: BrandingSlots }>('/branding');
    return res.data.data ?? { light: null, dark: null, footer: null, footerDark: null };
  } catch {
    return { light: null, dark: null, footer: null, footerDark: null };
  }
}

// Platform logos (business branding, admin-managed) for the nav/footer.
// The backend hands back SHORT-LIVED signed URLs (10 min), so caching a URL
// past its expiry would render a dead image. Two layers keep reloads
// instant without any fallback flash:
//  - module cache: shared across components mounting in the same session;
//  - localStorage: the fetched payload is persisted per-app (prod mounts
//    all portals same-origin, so keys MUST be app-prefixed, like the auth
//    tokens), so a fresh reload renders the logo immediately from the
//    persisted URLs and refreshes them in the background once stale
//    (8 min — comfortably under the 10-min signed expiry).
const CACHE_KEY = 'client_branding_cache';
const CACHE_TTL_MS = 8 * 60 * 1000;

interface BrandingCache {
  fetchedAt: number;
  slots: BrandingSlots;
}

let cache: BrandingCache | null | undefined;
let fetching = false;

function readCache(): BrandingCache | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BrandingCache;
    return parsed && typeof parsed.fetchedAt === 'number' && parsed.slots ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(slots: BrandingSlots): void {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), slots }));
  } catch {
    // storage unavailable (private mode, quota) — the module cache still
    // covers this session, next reload just re-fetches once.
  }
}

/**
 * Signed URL for one branding slot. undefined = still loading on a
 * never-cached visit (render a sized placeholder); null = slot empty
 * (render the default BrandMark).
 */
export function useBrandLogo(variant: BrandLogoVariant = 'light'): string | null | undefined {
  const [slots, setSlots] = useState<BrandingSlots | null | undefined>(cache?.slots);

  useEffect(() => {
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return;
    if (fetching) return;
    fetching = true;
    let cancelled = false;
    // All state updates ride promise continuations: the persisted cache (if
    // any) is applied on the first microtask — before the browser paints, so
    // a reload never flashes the fallback — then the payload is refreshed
    // in the background once the cache is stale.
    void Promise.resolve()
      .then(() => cache ?? readCache())
      .then((cached) => {
        if (cancelled) return null;
        if (cached) {
          cache = cached;
          setSlots(cached.slots);
          return Date.now() - cached.fetchedAt < CACHE_TTL_MS ? null : fetchBranding();
        }
        return fetchBranding();
      })
      .then((next) => {
        if (cancelled || next === null) return;
        cache = { fetchedAt: Date.now(), slots: next };
        writeCache(next);
        setSlots(next);
      })
      .finally(() => {
        fetching = false;
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return slots?.[variant] ?? null;
}

/**
 * Logo for a theme-aware surface (navbar, footer): resolves the EFFECTIVE
 * color scheme — a user on `system` mode follows the OS preference — and
 * picks the matching variant. Footers pass ('footer', 'footerDark').
 */
export function useThemeBrandLogo(
  lightVariant: BrandLogoVariant = 'light',
  darkVariant: BrandLogoVariant = 'dark',
): string | null | undefined {
  const { mode, systemMode } = useColorScheme();
  const effective = mode === 'system' ? systemMode ?? 'light' : mode;
  return useBrandLogo(effective === 'dark' ? darkVariant : lightVariant);
}