import type { components } from '@2bready/api-client';

export type Company = components['schemas']['CompanyResource'];
export type Document = components['schemas']['DocumentResource'];

// Not part of CompanyResource itself (that's generic, no concept of "hired
// by this TP") — the level(s) this firm is actively hired for at this
// company, surfaced separately by TpAssignmentController::myCompanies.
export interface CompanyWithHiredLevels extends Company {
  hired_levels: string[];
}
