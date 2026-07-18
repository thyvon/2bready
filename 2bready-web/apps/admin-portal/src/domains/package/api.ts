import api from '@/lib/api';
import type { JourneyLevel, Package, StorePackagePayload, UpdatePackagePayload } from './types';

export async function listPackages(): Promise<Package[]> {
  const res = await api.get<{ data: Package[] }>('/packages');
  return res.data.data;
}

// The journey-level taxonomy — populates the package form's journey_level_id
// dropdown. Full CRUD for the taxonomy itself lives in domains/journey-template
// (see /journey-templates); this flat list stays here as-is since it's this
// form's only consumer and gated on package.view, not journey_template.view.
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
