import api from '@/lib/api';
import type {
  DocumentTemplate,
  JourneyLevel,
  JourneyTemplate,
  Milestone,
  StoreDocumentTemplatePayload,
  StoreJourneyLevelPayload,
  StoreJourneyTemplatePayload,
  StoreMilestonePayload,
  UpdateDocumentTemplatePayload,
  UpdateJourneyLevelPayload,
  UpdateJourneyTemplatePayload,
  UpdateMilestonePayload,
} from './types';

export async function listJourneyTemplates(): Promise<JourneyTemplate[]> {
  const res = await api.get<{ data: JourneyTemplate[] }>('/journey-templates');
  return res.data.data;
}

// Full nested tree — levels.milestones.document_templates — the detail/editor page's data source.
export async function getJourneyTemplate(id: string): Promise<JourneyTemplate> {
  const res = await api.get<{ data: JourneyTemplate }>(`/journey-templates/${id}`);
  return res.data.data;
}

export async function createJourneyTemplate(data: StoreJourneyTemplatePayload): Promise<JourneyTemplate> {
  const res = await api.post<{ data: JourneyTemplate }>('/journey-templates', data);
  return res.data.data;
}

export async function updateJourneyTemplate(id: string, data: UpdateJourneyTemplatePayload): Promise<JourneyTemplate> {
  const res = await api.patch<{ data: JourneyTemplate }>(`/journey-templates/${id}`, data);
  return res.data.data;
}

export async function deleteJourneyTemplate(id: string): Promise<void> {
  await api.delete(`/journey-templates/${id}`);
}

export async function createJourneyLevel(templateId: string, data: StoreJourneyLevelPayload): Promise<JourneyLevel> {
  const res = await api.post<{ data: JourneyLevel }>(`/journey-templates/${templateId}/levels`, data);
  return res.data.data;
}

export async function updateJourneyLevel(id: string, data: UpdateJourneyLevelPayload): Promise<JourneyLevel> {
  const res = await api.patch<{ data: JourneyLevel }>(`/journey-levels/${id}`, data);
  return res.data.data;
}

export async function deleteJourneyLevel(id: string): Promise<void> {
  await api.delete(`/journey-levels/${id}`);
}

export async function createMilestone(levelId: string, data: StoreMilestonePayload): Promise<Milestone> {
  const res = await api.post<{ data: Milestone }>(`/journey-levels/${levelId}/milestones`, data);
  return res.data.data;
}

export async function updateMilestone(id: string, data: UpdateMilestonePayload): Promise<Milestone> {
  const res = await api.patch<{ data: Milestone }>(`/milestones/${id}`, data);
  return res.data.data;
}

export async function deleteMilestone(id: string): Promise<void> {
  await api.delete(`/milestones/${id}`);
}

export async function createDocumentTemplate(milestoneId: string, data: StoreDocumentTemplatePayload): Promise<DocumentTemplate> {
  const res = await api.post<{ data: DocumentTemplate }>(`/milestones/${milestoneId}/document-templates`, data);
  return res.data.data;
}

export async function createDocumentTemplateChild(parentId: string, data: StoreDocumentTemplatePayload): Promise<DocumentTemplate> {
  const res = await api.post<{ data: DocumentTemplate }>(`/document-templates/${parentId}/children`, data);
  return res.data.data;
}

export async function updateDocumentTemplate(id: string, data: UpdateDocumentTemplatePayload): Promise<DocumentTemplate> {
  const res = await api.patch<{ data: DocumentTemplate }>(`/document-templates/${id}`, data);
  return res.data.data;
}

export async function deleteDocumentTemplate(id: string): Promise<void> {
  await api.delete(`/document-templates/${id}`);
}
