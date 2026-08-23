import api from '@/lib/api';
import type { TpHire, CreateTpHirePayload, CreateTpHireResult } from './types';

export async function listTpHires(tpPartnerId?: string): Promise<TpHire[]> {
  const res = await api.get<{ data: TpHire[] }>('/tp-hires');
  // Backend filters by company_id, not tp_partner_id — filtered client-side here
  // since a firm's hire count is small (v1 has no self-service marketplace yet).
  return tpPartnerId ? res.data.data.filter((h) => h.tp_partner_id === tpPartnerId) : res.data.data;
}

export async function createTpHire(data: CreateTpHirePayload): Promise<CreateTpHireResult> {
  const res = await api.post<{ data: CreateTpHireResult }>('/tp-hires', data);
  return res.data.data;
}

export async function markTpHirePaidOut(id: string): Promise<TpHire> {
  const res = await api.post<{ data: TpHire }>(`/tp-hires/${id}/mark-paid-out`);
  return res.data.data;
}

/** Pre-payment correction only — backend 403s once the hire is active. */
export async function updateTpHire(id: string, data: { journey_level: 'L2' | 'L3' | 'L4' }): Promise<TpHire> {
  const res = await api.patch<{ data: TpHire }>(`/tp-hires/${id}`, data);
  return res.data.data;
}

export async function completeTpHire(id: string): Promise<TpHire> {
  const res = await api.post<{ data: TpHire }>(`/tp-hires/${id}/complete`);
  return res.data.data;
}

export async function cancelTpHire(id: string): Promise<TpHire> {
  const res = await api.post<{ data: TpHire }>(`/tp-hires/${id}/cancel`);
  return res.data.data;
}
