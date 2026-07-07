import { PortalShell } from '@/components/layout/PortalShell';

// Every authenticated app route (Overview, Journey, Audits, etc.) lives
// under this group and gets the navbar. Onboarding (app/onboarding) is a
// sibling of this group, not a child of it — a brand-new company shouldn't
// see the full nav (Journey/Audits/Billing/...) before their profile even
// exists, so it deliberately opts out of PortalShell entirely rather than
// hiding nav items conditionally within one shared shell.
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
