'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { clientPortalUrl } from '@/lib/client-portal-url';

// Redirect to the correct dashboard area based on user role. This app is
// back-office only (admin/staff/finance) — company_owner/company_member and
// auditor accounts have no home here at all: the former go to client-portal,
// the latter to tp-portal (they authenticate there via portal.tp.access and
// are rejected by adminLogin anyway). See feedback memory: "Client (Company
// owner) use only at Client portal."
export default function DashboardRedirectPage() {
  const router = useRouter();
  const { hasAnyRole } = useAuthStore();

  useEffect(() => {
    if (hasAnyRole(['admin', 'staff', 'finance'])) {
      router.replace('/');
    } else {
      window.location.href = clientPortalUrl();
    }
  }, [hasAnyRole, router]);

  return null;
}
