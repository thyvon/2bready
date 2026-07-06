// Marketing is now a separate app/deployment from admin-portal, so its
// login/register/pricing CTAs can no longer be same-origin relative links —
// they have to cross an app boundary. The target origin is env-configurable
// rather than hardcoded because the production topology (subdomain vs a
// reverse-proxy path split on one domain) isn't decided yet; whichever is
// chosen, this is the one place that needs to know about it.
const ADMIN_PORTAL_URL = process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL ?? 'http://localhost:3000';

export function adminUrl(path: string): string {
  return `${ADMIN_PORTAL_URL}${path}`;
}
