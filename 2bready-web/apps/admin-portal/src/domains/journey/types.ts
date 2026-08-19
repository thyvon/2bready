import type { components } from '@2bready/api-client';

// DocumentHistoryEntryResource wraps a PeriodHistoryEntry, not a Document —
// Scramble can't infer its field types at all (everything comes back a
// non-nullable string, even plain booleans). Hand-declared here instead,
// same shape client-portal's journey-api.ts already uses for this resource.
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
  comment: string | null;
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
  client_can_add_subdocs: boolean;
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

// JourneyResource.mapMilestone() returns `completed` straight from
// MilestoneUnlockRuleEngine::isMilestoneSatisfied(), which is a real bool —
// but Scramble types it as a non-nullable string. Override here, same
// hand-declared-shape pattern as JourneyDocument/DocumentHistoryEntry above.
export type JourneyMilestone = Omit<RawMilestone, 'documents' | 'completed'> & { completed: boolean; documents: JourneyDocument[] };
export type JourneyLevel = Omit<RawLevel, 'milestones'> & { milestones: JourneyMilestone[] };
export type Journey = Omit<RawJourney, 'levels'> & { levels: JourneyLevel[] };

// Flattens a document and every one of its sub-documents (to any depth) —
// progress/status lookups need every document, not just the top-level ones.
export function flattenDocuments(docs: JourneyDocument[]): JourneyDocument[] {
  return docs.flatMap((doc) => [doc, ...flattenDocuments(doc.children)]);
}

// Returns the first document (top-level or nested) matching the checklist
// id — the same helper client-portal's journey-api.ts uses, so staff and
// company see identical post-upload polling behaviour.
export function findDocument(journey: Journey | null, documentId: string): JourneyDocument | null {
  if (!journey) return null;
  return flattenDocuments(
    journey.levels.flatMap((level) => level.milestones.flatMap((milestone) => milestone.documents)),
  ).find((doc) => doc.id === documentId) ?? null;
}
