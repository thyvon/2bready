import type { components } from '@2bready/api-client';

export type Audit = components['schemas']['AuditResource'];
export type AuditStatus = components['schemas']['AuditStatus'];
export type AuditorUser = components['schemas']['UserResource'];

export type ReviewAuditPayload = {
  decision: 'approved' | 'rejected';
};