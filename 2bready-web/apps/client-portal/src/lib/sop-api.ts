import api from '@/lib/api';
import type { components } from '@2bready/api-client';

// SOP reading for company users (v3 §0.2/§1.5): companies see their own
// company-specific SOPs plus global templates they've adopted, with the
// effective content resolved backend-side (adoption override > SOP content,
// Khmer falls back to English).

export type Sop = components['schemas']['SopResource'];

export type EffectiveSopContent = components['schemas']['EffectiveSopContentResource'] & {
  // The resource emits null when no Khmer variant exists (EN fallback) —
  // Scramble can't see through the resolved-array indirection.
  effective_at: string | null;
  content: string | null;
};

export type SopSignoff = {
  id: string;
  sop_id: string;
  company_id: string;
  sop?: { id: string; title: string; version: string } | null;
  user?: { id: string; name: string } | null;
  signed_at: string | null;
  sent_by?: { id: string; name: string } | null;
  created_at: string | null;
};

export async function listSops(): Promise<Sop[]> {
  const res = await api.get<{ data: Sop[] }>('/sops');
  return res.data.data;
}

export async function getSopEffectiveContent(sopId: string, locale: 'en' | 'kh'): Promise<EffectiveSopContent> {
  const res = await api.get<{ data: EffectiveSopContent }>(`/sops/${sopId}/effective-content`, {
    params: { locale },
  });
  return res.data.data;
}

// ─── Sign-offs (v3 Sprint 8: read & acknowledge) ───────────────────────────

export async function listMySignoffs(): Promise<SopSignoff[]> {
  const res = await api.get<{ data: SopSignoff[] }>('/signoffs/mine');
  return res.data.data;
}

export async function listSopSignoffs(sopId: string): Promise<SopSignoff[]> {
  const res = await api.get<{ data: SopSignoff[] }>(`/sops/${sopId}/signoffs`);
  return res.data.data;
}

export async function sendSopSignoffs(sopId: string, userIds: string[]): Promise<SopSignoff[]> {
  const res = await api.post<{ data: SopSignoff[] }>(`/sops/${sopId}/signoffs`, { user_ids: userIds });
  return res.data.data;
}

export async function acknowledgeSignoff(signoffId: string): Promise<SopSignoff> {
  const res = await api.post<{ data: SopSignoff }>(`/signoffs/${signoffId}/acknowledge`);
  return res.data.data;
}
