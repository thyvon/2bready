import { PortalShell } from '@/components/layout/PortalShell';
import { PortalAuthGuard } from '@/components/layout/PortalAuthGuard';
import JourneyProvider from '@/components/JourneyProvider';
import PackageProvider from '@/components/PackageProvider';

// Every authenticated app route (Overview, Journey, Audits, etc.) lives
// under this group and gets the navbar. Onboarding (app/onboarding) is a
// sibling of this group, not a child of it — a brand-new company shouldn't
// see the full nav (Journey/Audits/Billing/...) before their profile even
// exists, so it deliberately opts out of PortalShell entirely rather than
// hiding nav items conditionally within one shared shell.
//
// JourneyProvider/PackageProvider wrap every route here (not just
// /journey or /billing) because Overview, Data Room, SOPs, Trust Badge,
// and Billing all need the same real journey tree and real per-level
// pricing/tier data too — one fetch each, shared via context, instead of
// every page re-fetching it or falling back to a hardcoded local copy.
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalAuthGuard>
      <JourneyProvider>
        <PackageProvider>
          <PortalShell>{children}</PortalShell>
        </PackageProvider>
      </JourneyProvider>
    </PortalAuthGuard>
  );
}
