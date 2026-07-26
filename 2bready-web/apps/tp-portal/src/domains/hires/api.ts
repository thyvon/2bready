import api from '@/lib/api';
import type { Company, Document } from './types';

export async function listMyCompanies(): Promise<Company[]> {
  const res = await api.get<{ data: Company[] }>('/tp/companies');
  return res.data.data;
}

export async function listCompanyDocuments(companyId: string): Promise<Document[]> {
  const res = await api.get<{ data: Document[] }>(`/tp/companies/${companyId}/documents`);
  return res.data.data;
}

export async function verifyDocument(documentId: string): Promise<Document> {
  const res = await api.post<{ data: Document }>(`/documents/${documentId}/verify`);
  return res.data.data;
}

export async function rejectDocument(documentId: string, reason: string): Promise<Document> {
  const res = await api.post<{ data: Document }>(`/documents/${documentId}/reject`, { reason });
  return res.data.data;
}
