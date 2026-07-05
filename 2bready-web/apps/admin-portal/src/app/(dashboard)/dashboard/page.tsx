'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

// Redirect to the correct dashboard area based on user role
export default function DashboardRedirectPage() {
  const router = useRouter();
  const { hasAnyRole } = useAuthStore();

  useEffect(() => {
    if (hasAnyRole(['admin', 'staff', 'finance'])) {
      router.replace('/admin');
    } else if (hasAnyRole(['auditor'])) {
      router.replace('/auditor');
    } else {
      router.replace('/company');
    }
  }, [hasAnyRole, router]);

  return null;
}
