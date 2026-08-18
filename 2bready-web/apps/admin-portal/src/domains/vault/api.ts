import api from '@/lib/api';
import type { VaultStatus } from './types';

// Back-office vault (v3 §4.2): the PIN gate over sensitive L3/L4 document
// previews. The PIN itself is only ever sent inbound — never read back from
// any endpoint. Errors bubble to the caller (getApiError) like everywhere
// else in this app.

export async function getVaultStatus(companyId: string): Promise<VaultStatus> {
  const res = await api.get<{ data: VaultStatus }>('/vault/status', {
    params: { company_id: companyId },
  });
  return res.data.data;
}

export async function setVaultPin(companyId: string, pin: string): Promise<{ pin_set: boolean }> {
  const res = await api.post<{ data: { company_id: string; pin_set: boolean } }>('/vault/pin', { company_id: companyId, pin });
  return res.data.data;
}

export async function unlockVault(companyId: string, pin: string): Promise<{ unlocked: boolean }> {
  const res = await api.post<{ data: { company_id: string; unlocked: boolean } }>('/vault/unlock', { company_id: companyId, pin });
  return res.data.data;
}

export async function lockVault(companyId: string): Promise<{ unlocked: boolean }> {
  const res = await api.post<{ data: { company_id: string; unlocked: boolean } }>('/vault/lock', { company_id: companyId });
  return res.data.data;
}