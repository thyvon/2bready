import type { components } from '@2bready/api-client';

export type JourneyTemplate = components['schemas']['JourneyTemplateResource'];
export type JourneyLevel = components['schemas']['JourneyLevelResource'];
export type Milestone = components['schemas']['MilestoneResource'];
export type DocumentTemplate = components['schemas']['DocumentTemplateResource'];
export type JourneyPillar = components['schemas']['JourneyPillar'];

export type StoreJourneyTemplatePayload = {
  country_code: string;
  industry_id: string;
  name: string;
  name_kh?: string;
  is_active?: boolean;
};
export type UpdateJourneyTemplatePayload = Partial<StoreJourneyTemplatePayload>;

export type StoreJourneyLevelPayload = {
  code: string;
  name: string;
  pathway_name: string;
  pillar: JourneyPillar;
  sort_order?: number;
};
export type UpdateJourneyLevelPayload = Partial<StoreJourneyLevelPayload>;

export type StoreMilestonePayload = {
  name: string;
  sort_order?: number;
};
export type UpdateMilestonePayload = Partial<StoreMilestonePayload>;

export type StoreDocumentTemplatePayload = {
  name: string;
  description?: string;
  is_required?: boolean;
  recurrence_type?: 'one_time' | 'rolling' | 'periodic_monthly' | 'periodic_annual';
  expiry_months?: number;
  effective_since?: string;
  sort_order?: number;
};
export type UpdateDocumentTemplatePayload = Partial<StoreDocumentTemplatePayload>;
