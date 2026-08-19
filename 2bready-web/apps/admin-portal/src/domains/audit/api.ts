import api from '@/lib/api';
import type { Audit, ReviewAuditPayload } from './types';

export async function listAudits(status?: string): Promise<Audit[]> {
  const res = await api.get<{ data: Audit[] }>('/audits', {
    params: { status: status || undefined },
  });
  return res.data.data;
}

export async function getAudit(id: string): Promise<Audit> {
  const res = await api.get<{ data: Audit }>(`/audits/${id}`);
  return res.data.data;
}

export async function assignAuditor(id: string, auditorId: string): Promise<Audit> {
  const res = await api.post<{ data: Audit }>(`/audits/${id}/assign`, { auditor_id: auditorId });
  return res.data.data;
}

export async function reviewAudit(id: string, data: ReviewAuditPayload): Promise<Audit> {
  const res = await api.post<{ data: Audit }>(`/audits/${id}/review`, data);
  return res.data.data;
}

export async function cancelAudit(id: string): Promise<Audit> {
  const res = await api.post<{ data: Audit }>(`/audits/${id}/cancel`);
  return res.data.data;
}