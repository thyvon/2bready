import api from '@/lib/api';
import type { TpPartner, User, StoreTpPartnerPayload, UpdateTpPartnerPayload, RegisterAuditorPayload } from './types';

export async function listTpPartners(): Promise<TpPartner[]> {
  const res = await api.get<{ data: TpPartner[] }>('/tp-partners');
  return res.data.data;
}

export async function getTpPartner(id: string): Promise<TpPartner> {
  const res = await api.get<{ data: TpPartner }>(`/tp-partners/${id}`);
  return res.data.data;
}

export async function createTpPartner(data: StoreTpPartnerPayload): Promise<TpPartner> {
  const res = await api.post<{ data: TpPartner }>('/tp-partners', data);
  return res.data.data;
}

export async function updateTpPartner(id: string, data: UpdateTpPartnerPayload): Promise<TpPartner> {
  const res = await api.patch<{ data: TpPartner }>(`/tp-partners/${id}`, data);
  return res.data.data;
}

export async function deleteTpPartner(id: string): Promise<void> {
  await api.delete(`/tp-partners/${id}`);
}

export async function listAuditors(tpPartnerId: string): Promise<User[]> {
  const res = await api.get<{ data: User[] }>(`/tp-partners/${tpPartnerId}/auditors`);
  return res.data.data;
}

export async function registerAuditor(tpPartnerId: string, data: RegisterAuditorPayload): Promise<User> {
  const res = await api.post<{ data: User }>(`/tp-partners/${tpPartnerId}/auditors`, data);
  return res.data.data;
}
