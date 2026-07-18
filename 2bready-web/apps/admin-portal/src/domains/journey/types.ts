import type { components } from '@2bready/api-client';

// JourneyResource.mapDocument() builds `children` as a plain recursive PHP
// array (not a JsonResource::collection call), which Scramble can't trace
// into a precise recursive type — it comes back as `{ [key: string]: unknown
// }[]`. Hand-declared here instead, same shape the backend actually returns.
export interface JourneyDocument {
  id: string;
  document_id: string | null;
  name: string;
  is_required: boolean;
  status: string;
  company_id: string | null;
  children: JourneyDocument[];
}

type RawJourney = components['schemas']['JourneyResource'];
type RawLevel = RawJourney['levels'][number];
type RawMilestone = RawLevel['milestones'][number];

export type JourneyMilestone = Omit<RawMilestone, 'documents'> & { documents: JourneyDocument[] };
export type JourneyLevel = Omit<RawLevel, 'milestones'> & { milestones: JourneyMilestone[] };
export type Journey = Omit<RawJourney, 'levels'> & { levels: JourneyLevel[] };
