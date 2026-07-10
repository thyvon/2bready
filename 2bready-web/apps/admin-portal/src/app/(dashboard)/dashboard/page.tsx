'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { clientPortalUrl } from '@/lib/client-portal-url';

// Redirect to the correct dashboard area based on user role. This app is
// back-office only (admin/staff/finance/auditor) — a company_owner/
// company_member account has no home here at all, so it's sent out to
// client-portal instead of anywhere inside this app. See feedback memory:
// "Client (Company owner) use only at Client portal."
export default function DashboardRedirectPage() {
  const router = useRouter();
  const { hasAnyRole } = useAuthStore();

  useEffect(() => {
    if (hasAnyRole(['admin', 'staff', 'finance'])) {
      router.replace('/admin');
    } else if (hasAnyRole(['auditor'])) {
      router.replace('/auditor');
    } else {
      window.location.href = clientPortalUrl();
    }
  }, [hasAnyRole, router]);

  return null;
}
