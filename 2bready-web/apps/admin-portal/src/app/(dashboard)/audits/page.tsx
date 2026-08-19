'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import PageHeader from '@/components/ui/PageHeader';
import AuditsListView from '@/domains/audit/components/AuditsListView';
import { useAuthStore } from '@/store/auth.store';
import { useTranslation } from '@/lib/i18n';

export default function AdminAuditsPage() {
  const router = useRouter();
  const { hasAnyRole } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (!hasAnyRole(['admin', 'staff', 'finance'])) router.replace('/dashboard');
  }, [hasAnyRole, router]);

  return (
    <>
      <PageHeader title={t('audit.title')} />
      <AuditsListView />
    </>
  );
}