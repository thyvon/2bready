import type { components } from '@2bready/api-client';
import type { TranslationKey } from '@/lib/i18n';

// Scramble's inference for whenLoaded() closures and casts is lossy (it emits
// is_active: string and adoptions?: string), so we normalize those fields here.
// Everything else comes straight from the generated contract.

export type SopAdoption = {
  id: string;
  company: { id: string; name: string };
  override_content_en: string | null;
  override_content_kh: string | null;
  adopted_at: string;
  adopted_by: { id: string; name: string } | null;
};

export type Sop = Omit<
  components['schemas']['SopResource'],
  'is_active' | 'adoptions' | 'content_kh' | 'effective_at'
> & {
  is_active: boolean;
  content_kh: string | null;
  effective_at: string | null;
  adoptions?: SopAdoption[] | null;
};

export type SopStatus = 'draft' | 'active' | 'archived';

export function getSopStatus(sop: Sop): SopStatus {
  if (!sop.is_active) return 'draft';
  if (sop.effective_at && new Date(sop.effective_at) > new Date()) return 'draft';
  return 'active';
}

export function sopStatusLabel(status: SopStatus, t: (key: TranslationKey) => string): string {
  switch (status) {
    case 'active':
      return t('sop.status.active');
    case 'draft':
      return t('sop.status.draft');
    case 'archived':
      return t('sop.status.archived');
  }
}