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
