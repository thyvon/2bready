import type { components } from '@2bready/api-client';

// Scramble infers `changes`/`metadata` as `unknown[] | null` from the PHP
// `array` cast — imprecise (the real shape is an object, not a list), so
// overridden here rather than fighting Scramble's inference on the backend
// for a type this module is the only consumer of.
export type AuditLog = Omit<components['schemas']['AuditLogResource'], 'changes' | 'metadata'> & {
  changes: { old: Record<string, unknown> | null; new: Record<string, unknown> | null } | null;
  metadata: Record<string, unknown> | null;
};

export interface AuditLogListFilters {
  action?: string;
  auditable_type?: string;
  user_id?: string;
  company_id?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface Pagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}
