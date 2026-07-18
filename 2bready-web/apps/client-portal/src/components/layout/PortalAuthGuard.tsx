'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

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

  return <>{children}</>;
}
