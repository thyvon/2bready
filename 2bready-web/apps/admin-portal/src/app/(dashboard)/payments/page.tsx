'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import PageHeader from '@/components/ui/PageHeader';
import PaymentsListView from '@/domains/payment/components/PaymentsListView';
import { useAuthStore } from '@/store/auth.store';
import { useTranslation } from '@/lib/i18n';

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { hasAnyRole } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (!hasAnyRole(['admin', 'staff', 'finance'])) router.replace('/dashboard');
  }, [hasAnyRole, router]);

  return (
    <>
      <PageHeader title={t('admin.payments_title')} />
      <PaymentsListView />
    </>
  );
}
