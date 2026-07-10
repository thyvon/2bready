// Mirrors admin-url.ts — marketing is a separate app/deployment from
// client-portal too, so the "Client Portal" CTA needs the same env-configurable
// cross-app URL treatment as the admin "Login" CTA. Production is a same-origin
// path split (/portal); local dev is a different port entirely.
const CLIENT_PORTAL_URL = process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL ?? 'http://localhost:3001';

export function clientPortalUrl(path: string): string {
  return `${CLIENT_PORTAL_URL}${path}`;
}
