import api from '@/lib/api';
import type { Package, StorePackagePayload, UpdatePackagePayload } from './types';

export async function listPackages(): Promise<Package[]> {
  const res = await api.get<{ data: Package[] }>('/packages');
  return res.data.data;
}

export async function createPackage(data: StorePackagePayload): Promise<Package> {
  const res = await api.post<{ data: Package }>('/packages', data);
  return res.data.data;
}

export async function updatePackage(id: string, data: UpdatePackagePayload): Promise<Package> {
  const res = await api.patch<{ data: Package }>(`/packages/${id}`, data);
  return res.data.data;
}

export async function deletePackage(id: string): Promise<void> {
  await api.delete(`/packages/${id}`);
}
