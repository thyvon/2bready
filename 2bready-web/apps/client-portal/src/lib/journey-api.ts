import api from '@/lib/api';
import type { components } from '@2bready/api-client';
import type { Pillar } from '@/lib/journey-data';

export type RecurrenceType = 'one_time' | 'rolling' | 'periodic_monthly' | 'periodic_annual';

// DocumentHistoryEntryResource wraps a PeriodHistoryEntry, not a Document —
// Scramble can't infer its field types at all (everything comes back a
// non-nullable `string` in the generated schema, even plain booleans), a
// dead end tried four different ways backend-side. Hand-declared here
// instead, matching the real shape confirmed via the actual API response.
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
  recurrence_type: RecurrenceType;
  expiry_months: number | null;
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

// 404s when the current company's industry/country has no matching
// JourneyTemplate yet — that's a valid "no journey" state, not an error, so
// callers should treat a thrown 404 as "journey === null", not surface it.
export async function getMyJourney(): Promise<Journey> {
  const res = await api.get<{ data: Journey }>('/journey');
  return res.data.data;
}

// Frontend has one bucket for "still being processed, nothing to act on
// yet" and one for "something's wrong, needs a fresh upload" — the real
// backend enum splits those into scan sub-states (pending_scan/scan_failed)
// that don't have a distinct UI treatment yet. Collapse rather than surface
// a status the UI has no badge/copy for.
export type DocStatus = 'pending' | 'verified' | 'review' | 'rejected' | 'expired';

export function toDocStatus(status: string): DocStatus {
  if (status === 'pending_scan') return 'pending';
  if (status === 'scan_failed') return 'rejected';
  return status as DocStatus;
}

export const DOC_STATUS_LABEL: Record<DocStatus, string> = {
  pending: 'Pending',
  verified: 'Verified',
  review: 'In Review',
  rejected: 'Rejected',
  expired: 'Expired',
};

// Per-level emoji only — a pure rendering choice with no backend column at
// all. Tier used to live here too (LEVEL_META[code].tier), but Package now
// has a real `tier` + `journey_level_id`, so real tier-per-level comes from
// PackageProvider's `tierByLevelCode()` (see package-api.ts) instead.
export const LEVEL_EMOJI: Record<string, string> = {
  L1: '🔶',
  L2: '🥈',
  L3: '🥇',
  L4: '💎',
};

// Flattens a document and every one of its sub-documents (to any depth) —
// counts/progress below need every required document, not just the
// top-level ones, or totals would silently under-count once sub-documents
// exist. Display components still walk `doc.children` directly to keep the
// nesting visible; this is only for aggregation.
export function flattenDocuments(docs: JourneyDocument[]): JourneyDocument[] {
  return docs.flatMap((doc) => [doc, ...flattenDocuments(doc.children)]);
}

export function levelDocuments(level: JourneyLevel): JourneyDocument[] {
  return flattenDocuments(level.milestones.flatMap((milestone) => milestone.documents));
}

export function levelTotalDocs(level: JourneyLevel): number {
  return levelDocuments(level).length;
}

export function countVerified(docs: JourneyDocument[]): number {
  return docs.filter((doc) => toDocStatus(doc.status) === 'verified').length;
}

export function levelVerifiedDocs(level: JourneyLevel): number {
  return countVerified(levelDocuments(level));
}

export function allDocuments(journey: Journey | null): JourneyDocument[] {
  if (!journey) return [];
  return journey.levels.flatMap((level) => levelDocuments(level));
}

export function findDocument(journey: Journey | null, documentId: string): JourneyDocument | null {
  return allDocuments(journey).find((doc) => doc.id === documentId) ?? null;
}

export function pillarLevels(journey: Journey | null, pillarId: Pillar['id']): JourneyLevel[] {
  if (!journey) return [];
  return journey.levels.filter((level) => level.pillar === pillarId);
}

export function pillarDocuments(journey: Journey | null, pillarId: Pillar['id']): JourneyDocument[] {
  return pillarLevels(journey, pillarId).flatMap((level) => levelDocuments(level));
}
