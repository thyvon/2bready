import api from '@/lib/api';
import type { components } from '@2bready/api-client';
import type { Pillar } from '@/lib/journey-data';

export type Journey = components['schemas']['JourneyResource'];
export type JourneyLevel = Journey['levels'][number];
export type JourneyMilestone = JourneyLevel['milestones'][number];
export type JourneyDocument = JourneyMilestone['documents'][number];

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

export function levelDocuments(level: JourneyLevel): JourneyDocument[] {
  return level.milestones.flatMap((milestone) => milestone.documents);
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
