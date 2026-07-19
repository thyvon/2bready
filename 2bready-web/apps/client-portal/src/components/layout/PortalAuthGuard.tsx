'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { CompanySuspendedScreen } from './CompanySuspendedScreen';

// Defense-in-depth only — the real enforcement boundary is the backend
// (AuthController::login rejects any account without the portal.client.access
// permission before ever issuing a token, see lib/auth-api.ts). This guards
// against a token minted before that existed, or a future regression: an
// admin/staff/finance/auditor account (company_id is always null for those
// roles) landing here would see a portal shell with no company to show.
// Mirrors admin-portal's (dashboard)/layout.tsx gate, reading the same
// permission-backed flag the backend used to decide whether to issue the
// token in the first place (User::canAccessClientPortal) — a role gaining or
// losing client-portal access only ever needs a RolePermissionSeeder change,
// never a frontend edit.
export function PortalAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, user, clearAuth } = useAuthStore();
  const blocked = hasHydrated && isAuthenticated && !(user?.can_access_client_portal ?? false);

  useEffect(() => {
    if (blocked) {
      clearAuth();
      router.replace('/login');
    }
  }, [blocked, clearAuth, router]);

  if (blocked) return null;

  // Mirrors the backend's own enforcement (EnsureCompanyIsActive middleware) —
  // a suspended/inactive current company otherwise 403s on the very first API
  // call JourneyProvider/PackageProvider make once the shell below mounts, so
  // check it here and render a lockout screen instead of ever letting the
  // shell/providers mount at all. Unlike the can_access_client_portal branch
  // above, this user IS legitimately logged in — don't clear auth or redirect.
  const companies = user?.companies ?? [];
  const currentCompany = companies.find((c) => c.id === user?.current_company_id) ?? companies[0];
  if (hasHydrated && isAuthenticated && currentCompany && currentCompany.status !== 'active') {
    return <CompanySuspendedScreen companyName={currentCompany.name} />;
  }

  return <>{children}</>;
}
