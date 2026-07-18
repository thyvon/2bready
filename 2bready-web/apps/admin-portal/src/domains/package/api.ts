import api from '@/lib/api';
import type { JourneyLevel, Package, StorePackagePayload, UpdatePackagePayload } from './types';

export async function listPackages(): Promise<Package[]> {
  const res = await api.get<{ data: Package[] }>('/packages');
  return res.data.data;
}

// The fixed journey-level taxonomy (L1..L4 today) — populates the package
// form's journey_level_id dropdown. No CRUD for the taxonomy itself yet.
export async function listJourneyLevels(): Promise<JourneyLevel[]> {
  const res = await api.get<{ data: JourneyLevel[] }>('/journey-levels');
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
