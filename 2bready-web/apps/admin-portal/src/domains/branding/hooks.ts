import { useEffect, useState, useSyncExternalStore } from 'react';
import { useColorScheme } from '@mui/material/styles';
import { getBranding, type BrandLogoVariant, type BrandingSlots } from './api';

// Platform logos (business branding, admin-managed) for the sidebar etc.
// The backend hands back SHORT-LIVED signed URLs (10 min), so caching a URL
// past its expiry would render a dead image. Two layers keep reloads
// instant without any fallback flash:
//  - module cache: shared across components mounting in the same session;
//  - localStorage: the fetched payload is persisted per-app (prod mounts
//    all portals same-origin, so keys MUST be app-prefixed, like the auth
//    tokens), so a fresh reload renders the logo immediately from the
//    persisted URLs and refreshes them in the background once stale
//    (8 min — comfortably under the 10-min signed expiry).
const CACHE_KEY = 'admin_branding_cache';
const CACHE_TTL_MS = 8 * 60 * 1000;

interface BrandingCache {
  fetchedAt: number;
  slots: BrandingSlots;
}

let cache: BrandingCache | null | undefined;
let fetching = false;

// Invalidation signal: bumped every time an admin uploads/removes a logo.
// Mounted hooks subscribe via useSyncExternalStore and re-fetch when it
// changes — clearing the module/localStorage caches alone would leave the
// sidebar/auth/login showing stale URLs until the 8-min TTL passed.
let invalidateVersion = 0;
const invalidateListeners = new Set<() => void>();

function subscribeToInvalidation(listener: () => void): () => void {
  invalidateListeners.add(listener);
  return () => {
    invalidateListeners.delete(listener);
  };
}

function getInvalidateVersion(): number {
  return invalidateVersion;
}

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
 * Drop the cached branding payload so every mounted hook re-fetches on its
 * next pass. Call after an admin uploads/removes a logo — otherwise the
 * sidebar/auth/login keep showing the stale (or missing) logo until the
 * 8-minute TTL naturally expires.
 */
export function invalidateBrandingCache(): void {
  cache = null;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    // storage unavailable — the module cache reset above is enough.
  }
  invalidateVersion += 1;
  invalidateListeners.forEach((listener) => listener());
}

/**
 * Signed URL for one branding slot. undefined = still loading on a
 * never-cached visit (render a sized placeholder); null = slot empty
 * (render the default BrandMark).
 */
export function useBrandLogo(variant: BrandLogoVariant = 'light'): string | null | undefined {
  // Re-render + re-run the fetch effect whenever an admin invalidates the
  // cache (upload/remove) — otherwise this hook never notices the change.
  const invalidateVersion = useSyncExternalStore(subscribeToInvalidation, getInvalidateVersion, () => 0);
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
          // An all-null payload is treated as suspect: it usually means the
          // cache predates a logo upload (and the signed URL would be dead
          // anyway). Only a fresh cache that actually HAS a logo skips the
          // background refetch.
          const hasAny = Boolean(cached.slots && (cached.slots.light || cached.slots.dark || cached.slots.footer || cached.slots.footerDark));
          return hasAny && Date.now() - cached.fetchedAt < CACHE_TTL_MS ? null : getBranding();
        }
        return getBranding();
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
  }, [invalidateVersion]);

  return slots?.[variant] ?? null;
}

/**
 * Logo for a theme-aware surface (sidebar, navbar): resolves the EFFECTIVE
 * color scheme — a user on `system` mode follows the OS preference — and
 * picks the matching variant. Footers pass ('footer', 'footerDark').
 */
export function useBrandLogoForTheme(
  lightVariant: BrandLogoVariant = 'light',
  darkVariant: BrandLogoVariant = 'dark',
): string | null | undefined {
  const { mode, systemMode } = useColorScheme();
  const effective = mode === 'system' ? systemMode ?? 'light' : mode;
  return useBrandLogo(effective === 'dark' ? darkVariant : lightVariant);
}