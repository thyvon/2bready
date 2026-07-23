import api from '@/lib/api';
import type { Document } from './types';

// Uploading is normally company-side self-service, but staff can also enter
// a document on a company's behalf (e.g. received by email/in person) —
// see uploadDocument() below. Verify/reject stay this app's own
// responsibility either way.

export async function uploadDocument(companyId: string, documentTemplateId: string, file: File, periodKey?: string): Promise<Document> {
  const formData = new FormData();
  formData.append('company_id', companyId);
  formData.append('document_template_id', documentTemplateId);
  formData.append('file', file);
  if (periodKey) formData.append('period_key', periodKey);

  const res = await api.post<{ data: Document }>('/documents', formData);
  return res.data.data;
}

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
