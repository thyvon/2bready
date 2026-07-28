import type { components } from '@2bready/api-client';

// DocumentHistoryEntryResource wraps a PeriodHistoryEntry, not a Document —
// Scramble can't infer its field types at all (everything comes back a
// non-nullable string, even plain booleans). Hand-declared here instead,
// same shape admin-portal's/client-portal's journey types already use for
// this resource.
export interface DocumentHistoryEntry {
  id: string | null;
  // Set only for a periodic (monthly/annual) entry — "2026-07" / "2026".
  // Null for a rolling/one-time entry, which has no calendar slot.
  period_key: string | null;
  // True only for a periodic entry with no upload at all for that period —
  // a real gap, not the absence of data.
  is_missing: boolean;
  is_current: boolean;
  status: string | null;
  verified_at: string | null;
  expires_at: string | null;
  rejection_reason: string | null;
  created_at: string | null;
}

// JourneyResource.mapDocument() builds `children` as a plain recursive PHP
// array (not a JsonResource::collection call), which Scramble can't trace
// into a precise recursive type — it comes back as `{ [key: string]: unknown
// }[]`. Hand-declared here instead, same shape the backend actually returns.
export interface JourneyDocument {
  id: string;
  document_id: string | null;
  name: string;
  is_required: boolean;
  recurrence_type: 'one_time' | 'rolling' | 'periodic_monthly' | 'periodic_annual';
  expiry_months: number | null;
  effective_since: string | null;
  status: string;
  company_id: string | null;
  history: DocumentHistoryEntry[];
  children: JourneyDocument[];
}

type RawJourney = components['schemas']['JourneyResource'];
type RawLevel = RawJourney['levels'][number];
type RawMilestone = RawLevel['milestones'][number];

export type JourneyMilestone = Omit<RawMilestone, 'documents'> & { documents: JourneyDocument[] };
export type JourneyLevel = Omit<RawLevel, 'milestones'> & { milestones: JourneyMilestone[] };
export type Journey = Omit<RawJourney, 'levels'> & { levels: JourneyLevel[] };
