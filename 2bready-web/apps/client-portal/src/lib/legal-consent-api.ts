import api from '@/lib/api';

// Client-side legal consent (v3 §4.2/§5.1): a company user must accept the
// current versioned consent text before previewing or uploading a restricted
// P3/P4 (L3/L4) document. These endpoints drive the consent modal; the actual
// gating is enforced server-side in DocumentPolicy::view / UploadDocumentAction
// regardless of what this UI does.

export interface LegalConsentStatus {
  consent_required: boolean;
  accepted: boolean;
  version: string;
  text_en: string;
  text_kh: string;
}

export async function getLegalConsentStatus(levelCode: string): Promise<LegalConsentStatus> {
  const res = await api.get<{ data: LegalConsentStatus }>('/legal-consent/status', {
    params: { journey_level: levelCode },
  });
  return res.data.data;
}

export async function acceptLegalConsent(levelCode: string): Promise<{ accepted: boolean; version: string }> {
  const res = await api.post<{ data: { accepted: boolean; version: string } }>('/legal-consent/accept', {
    journey_level: levelCode,
  });
  return res.data.data;
}