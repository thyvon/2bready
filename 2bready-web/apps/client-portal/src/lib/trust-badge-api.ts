import api from '@/lib/api';
import type { components } from '@2bready/api-client';

// Client-side trust badges (v3 §1.5/§1.6): the list of levels a company has
// earned through approved audits, each with its public verification data.
// The actual payoff — the badge + certificate PDF/QR — is created on the
// backend by the IssueTrustBadgeListener when an audit is approved; this
// endpoint only reads what the tenant already owns.

export type TrustBadge = components['schemas']['TrustBadgeResource'];

// Simple TTL cache — JourneyProvider fetches these for the layout; the
// trust-badge page falls through to this cache instead of re-hitting the API.
let trustBadgesCache: TrustBadge[] | null = null;
let trustBadgesCacheTs = 0;
const TRUST_BADGES_CACHE_TTL = 30_000; // 30s

export function invalidateTrustBadgesCache(): void {
  trustBadgesCache = null;
  trustBadgesCacheTs = 0;
}

export async function listTrustBadges(): Promise<TrustBadge[]> {
  const now = Date.now();
  if (trustBadgesCache !== null && now - trustBadgesCacheTs < TRUST_BADGES_CACHE_TTL) {
    return trustBadgesCache;
  }
  const res = await api.get<{ data: TrustBadge[] }>('/trust-badges');
  trustBadgesCache = res.data.data;
  trustBadgesCacheTs = now;
  return trustBadgesCache;
}
export interface TrustBadgeReport {
  badge: {
    level: string;
    level_name: string;
    pathway_name: string;
    label: string;
    issued_at: string | null;
    verify_url: string | null;
    qr_code: string | null;
  };
  company: {
    name: string;
    name_kh: string | null;
    sector: string | null;
    country: string | null;
    employee_count: number | null;
  };
  audit: { id: string; score: number | null; feedback: string | null; approved_at: string | null };
  summary: string;
  stamp: Array<Record<string, unknown>> | Record<string, unknown> | null;
  ledger: Array<{ milestone: string; document: string; status: string; method: string; verified_at: string | null }>;
}

// The full certificate-style verification report behind a badge (enterprise
// profile + executive summary + per-document ledger) — rendered by the
// Overview Report dialog.
export async function fetchTrustBadgeReport(badgeId: string): Promise<TrustBadgeReport> {
  const res = await api.get<{ data: TrustBadgeReport }>(`/trust-badges/${badgeId}/report`);
  return res.data.data;
}
