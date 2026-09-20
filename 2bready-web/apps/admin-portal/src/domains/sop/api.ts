import api from '@/lib/api';
import type { Sop, SopAdoption } from './types';

// SOP API (v3 §0.2/§1.5): platform-wide templates + company adoptions with overrides.
// Admin/staff manage global templates; company owners adopt global SOPs for their
// company with optional EN/KH overrides.

export async function listSops(params?: {
  title?: string;
  is_active?: boolean;
  global_only?: boolean;
}): Promise<Sop[]> {
  const res = await api.get<{ data: Sop[] }>('/sops', { params });
  return res.data.data;
}

export async function getSop(id: string): Promise<Sop> {
  const res = await api.get<{ data: Sop }>(`/sops/${id}`);
  return res.data.data;
}

export async function createSop(data: {
  title: string;
  version: string;
  content_en: string;
  content_kh?: string | null;
  effective_at?: string | null;
  is_active?: boolean;
  company_id?: string | null;
}): Promise<Sop> {
  const res = await api.post<{ data: Sop }>('/sops', data);
  return res.data.data;
}

export async function updateSop(id: string, data: {
  title?: string;
  version?: string;
  content_en?: string;
  content_kh?: string | null;
  effective_at?: string | null;
  is_active?: boolean;
}): Promise<Sop> {
  const res = await api.put<{ data: Sop }>(`/sops/${id}`, data);
  return res.data.data;
}

export async function deleteSop(id: string): Promise<void> {
  await api.delete(`/sops/${id}`);
}

export async function activateSop(id: string, active: boolean): Promise<Sop> {
  const res = await api.post<{ data: Sop }>(`/sops/${id}/activate`, { active });
  return res.data.data;
}

export async function adoptSop(
  sopId: string,
  overrides?: { override_content_en?: string; override_content_kh?: string }
): Promise<{ sop_company: SopAdoption }> {
  const res = await api.post<{ data: { sop_company: SopAdoption } }>(`/sops/${sopId}/adopt`, overrides);
  return res.data.data;
}

export async function unadoptSop(sopCompanyId: string): Promise<void> {
  await api.delete(`/sops/sop-companies/${sopCompanyId}`);
}