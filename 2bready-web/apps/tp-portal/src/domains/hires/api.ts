import api from '@/lib/api';
import type { Company, CompanyWithHiredLevels, Document } from './types';

export async function listMyCompanies(): Promise<CompanyWithHiredLevels[]> {
  const res = await api.get<{ data: Company[]; meta: { hired_levels: Record<string, string[]> } }>('/tp/companies');
  return res.data.data.map((company) => ({ ...company, hired_levels: res.data.meta.hired_levels[company.id] ?? [] }));
}

export async function verifyDocument(documentId: string): Promise<Document> {
  const res = await api.post<{ data: Document }>(`/documents/${documentId}/verify`);
  return res.data.data;
}

export async function rejectDocument(documentId: string, reason: string): Promise<Document> {
  const res = await api.post<{ data: Document }>(`/documents/${documentId}/reject`, { reason });
  return res.data.data;
}
