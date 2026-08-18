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