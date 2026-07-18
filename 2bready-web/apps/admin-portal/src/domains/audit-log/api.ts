import api from '@/lib/api';
import type { AuditLog, AuditLogListFilters, Pagination } from './types';

export async function listAuditLogs(filters: AuditLogListFilters = {}): Promise<{ logs: AuditLog[]; pagination: Pagination }> {
  const res = await api.get<{ data: AuditLog[]; meta: { pagination: Pagination } }>('/audit-logs', { params: filters });
  return { logs: res.data.data, pagination: res.data.meta.pagination };
}
