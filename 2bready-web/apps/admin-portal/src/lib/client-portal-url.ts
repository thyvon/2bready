// This app is back-office only (admin/staff/finance/auditor) — a
// company_owner/company_member account has no home here and must be sent
// across the app boundary to client-portal. Env-configurable rather than a
// relative link for the same reason as marketing's admin-url.ts: in prod
// this is a same-origin path (/portal), in local dev it's a different port
// entirely, and that split isn't something this file should hardcode.
const CLIENT_PORTAL_URL = process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL ?? 'http://localhost:3001';

export function clientPortalUrl(path: string = ''): string {
  return `${CLIENT_PORTAL_URL}${path}`;
}
