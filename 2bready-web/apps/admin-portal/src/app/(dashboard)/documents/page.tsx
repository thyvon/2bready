'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import PageHeader from '@/components/ui/PageHeader';
import DocumentsListView from '@/domains/document/components/DocumentsListView';
import { useAuthStore } from '@/store/auth.store';
import { useTranslation } from '@/lib/i18n';

export default function AdminDocumentsPage() {
  const router = useRouter();
  const { hasAnyRole } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (!hasAnyRole(['admin', 'staff', 'finance'])) router.replace('/dashboard');
  }, [hasAnyRole, router]);

  return (
    <>
      <PageHeader title={t('admin.documents_title')} />
      <DocumentsListView />
    </>
  );
}
