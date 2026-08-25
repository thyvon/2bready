// Cross-app links to the marketing app's public pages (e.g. /verify/{id}).
// Marketing is a separate deployment from this portal, so the target origin
// is env-configurable — mirrors marketing's own adminUrl() helper.
const MARKETING_PORTAL_URL = process.env.NEXT_PUBLIC_MARKETING_URL ?? 'http://localhost:3002';

export function marketingUrl(path: string): string {
  return `${MARKETING_PORTAL_URL}${path}`;
}
