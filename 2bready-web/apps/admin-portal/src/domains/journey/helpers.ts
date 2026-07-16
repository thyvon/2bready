import type { Journey, JourneyLevel } from './types';

export function pillarLevels(journey: Journey | null, pillarId: Journey['levels'][number]['pillar']): JourneyLevel[] {
  return journey?.levels.filter((level) => level.pillar === pillarId) ?? [];
}

export function allDocuments(journey: Journey | null) {
  return journey?.levels.flatMap((level) => level.milestones.flatMap((milestone) => milestone.documents)) ?? [];
}

export function countVerified(documents: Array<{ status: string }>): number {
  return documents.filter((doc) => doc.status === 'verified').length;
}
