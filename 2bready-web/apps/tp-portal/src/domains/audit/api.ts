import api from '@/lib/api';
import type { Audit, SubmitAuditPayload } from './types';

/** This firm's audits across all its active engagements (the backend narrows
 *  the query to the caller's own firm via the auditor profile — never a
 *  manual company filter here). */
export async function listAudits(): Promise<Audit[]> {
  const res = await api.get<{ data: Audit[] }>('/audits');
  return res.data.data;
}

export async function getAudit(id: string): Promise<Audit> {
  const res = await api.get<{ data: Audit }>(`/audits/${id}`);
  return res.data.data;
}

/** The individually-assigned auditor submits score + feedback for their audit. */
export async function submitAudit(id: string, data: SubmitAuditPayload): Promise<Audit> {
  const res = await api.post<{ data: Audit }>(`/audits/${id}/submit`, data);
  return res.data.data;
}