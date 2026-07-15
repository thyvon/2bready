import api from '@/lib/api';
import type { Document } from './types';

// Uploading is company-side self-service (client-portal's responsibility) —
// this app only reviews (verifies/rejects) on 2bReady's behalf below.

export async function listDocuments(status?: string, companyId?: string): Promise<Document[]> {
  const res = await api.get<{ data: Document[] }>('/documents', {
    params: { status: status || undefined, company_id: companyId || undefined },
  });
  return res.data.data;
}

export async function verifyDocument(id: string): Promise<Document> {
  const res = await api.post<{ data: Document }>(`/documents/${id}/verify`);
  return res.data.data;
}

export async function rejectDocument(id: string, reason: string): Promise<Document> {
  const res = await api.post<{ data: Document }>(`/documents/${id}/reject`, { reason });
  return res.data.data;
}

export async function getPreviewUrl(id: string): Promise<{ url: string; mime_type: string; original_filename: string }> {
  const res = await api.get<{ data: { url: string; mime_type: string; original_filename: string } }>(`/documents/${id}/preview-url`);
  return res.data.data;
}
