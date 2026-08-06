import api from '@/lib/api';
import type { TpFirm, UpdatePricingPayload, UpdateProfilePayload } from './types';

/** The caller's own firm record (resolved server-side from the auditor profile). */
export async function getMyFirm(): Promise<TpFirm> {
  const res = await api.get<{ data: TpFirm }>('/tp/me');
  return res.data.data;
}

/** Firm self-service slice — only the per-level prices may change here. */
export async function updateFirmPricing(id: string, data: UpdatePricingPayload): Promise<TpFirm> {
  const res = await api.patch<{ data: TpFirm }>(`/tp-partners/${id}/pricing`, data);
  return res.data.data;
}

/** Firm self-service slice — only the identity fields (name / name_kh). */
export async function updateFirmProfile(id: string, data: UpdateProfilePayload): Promise<TpFirm> {
  const res = await api.patch<{ data: TpFirm }>(`/tp-partners/${id}/profile`, data);
  return res.data.data;
}
