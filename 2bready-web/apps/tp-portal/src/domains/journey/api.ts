import api from '@/lib/api';
import type { Journey } from './types';

export async function getCompanyJourney(companyId: string): Promise<Journey> {
  const res = await api.get<{ data: Journey }>(`/tp/companies/${companyId}/journey`);
  return res.data.data;
}

// Same signed-preview endpoint admin-portal's Journey tab uses — TP has
// document.view, so this is already authorized.
export async function getPreviewUrl(documentId: string): Promise<{ url: string; mime_type: string; original_filename: string }> {
  const res = await api.get<{ data: { url: string; mime_type: string; original_filename: string } }>(`/documents/${documentId}/preview-url`);
  return res.data.data;
}
