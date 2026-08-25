import api from '@/lib/api';
import type { components } from '@2bready/api-client';

// Client-side trust badges (v3 §1.5/§1.6): the list of levels a company has
// earned through approved audits, each with its public verification data.
// The actual payoff — the badge + certificate PDF/QR — is created on the
// backend by the IssueTrustBadgeListener when an audit is approved; this
// endpoint only reads what the tenant already owns.

export type TrustBadge = components['schemas']['TrustBadgeResource'];

export async function listTrustBadges(): Promise<TrustBadge[]> {
  const res = await api.get<{ data: TrustBadge[] }>('/trust-badges');
  return res.data.data;
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
  ledger: Array<{ milestone: string; document: string; status: string; method: string }>;
}

// The full certificate-style verification report behind a badge (enterprise
// profile + executive summary + per-document ledger) — rendered by the
// Overview Report dialog.
export async function fetchTrustBadgeReport(badgeId: string): Promise<TrustBadgeReport> {
  const res = await api.get<{ data: TrustBadgeReport }>(`/trust-badges/${badgeId}/report`);
  return res.data.data;
}
