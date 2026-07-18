import api from '@/lib/api';
import type { Journey } from './types';

export async function getCompanyJourney(companyId: string): Promise<Journey> {
  const res = await api.get<{ data: Journey }>(`/journey/companies/${companyId}`);
  return res.data.data;
}

export async function completeMilestone(companyId: string, milestoneId: string): Promise<void> {
  await api.post(`/journey/companies/${companyId}/milestones/${milestoneId}/complete`);
}

export interface ExtraRequirementPayload {
  name: string;
  description?: string;
  is_required?: boolean;
  expiry_months?: number;
  sort_order?: number;
}

// A company-specific extra requirement, added by staff on top of the shared
// taxonomy — root-level (under a milestone) or nested under an existing
// document, global or another one of this same company's own extras.
export async function createExtraRequirement(companyId: string, milestoneId: string, data: ExtraRequirementPayload): Promise<void> {
  await api.post(`/companies/${companyId}/milestones/${milestoneId}/document-templates`, data);
}

export async function createExtraRequirementChild(companyId: string, parentDocumentId: string, data: ExtraRequirementPayload): Promise<void> {
  await api.post(`/companies/${companyId}/document-templates/${parentDocumentId}/children`, data);
}

// Editing/deleting an extra reuses the same global document-template
// endpoints — no company scoping needed there, the row itself already
// carries the right company_id and the Policy gate is identical either way.
export async function updateExtraRequirement(id: string, data: Partial<ExtraRequirementPayload>): Promise<void> {
  await api.patch(`/document-templates/${id}`, data);
}

export async function deleteExtraRequirement(id: string): Promise<void> {
  await api.delete(`/document-templates/${id}`);
}
