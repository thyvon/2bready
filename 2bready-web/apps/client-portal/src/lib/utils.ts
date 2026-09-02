export { getApiError, type ApiError } from '@2bready/api-client';

export function formatCents(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(date));
}

/** Human-readable file size — KB/MB with one decimal when fractional. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
