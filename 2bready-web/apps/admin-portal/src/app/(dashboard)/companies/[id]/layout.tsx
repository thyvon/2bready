'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/store/auth.store';
import { getCompany } from '@/domains/company/api';
import type { Company } from '@/domains/company/types';
import { listDocuments } from '@/domains/document/api';
import { listPayments } from '@/domains/payment/api';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { CompanyWorkspaceProvider } from '@/domains/company/workspace-context';

function TabLabel({ text, count }: { text: string; count: number }) {
  return (
    <Badge badgeContent={count} color="warning" sx={{ pr: count > 0 ? 1.25 : 0 }}>
      {text}
    </Badge>
  );
}

export default function CompanyWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { hasAnyRole } = useAuthStore();
  const { t } = useTranslation();

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingDocuments, setPendingDocuments] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [countsReloadKey, setCountsReloadKey] = useState(0);

  useEffect(() => {
    if (!hasAnyRole(['admin', 'staff', 'finance'])) router.replace('/dashboard');
  }, [hasAnyRole, router]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        const data = await getCompany(params.id);
        if (!cancelled) setCompany(data);
      } catch (err) {
        if (!cancelled) setLoadError(getApiError(err).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [params.id, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const refreshCounts = useCallback(() => setCountsReloadKey((k) => k + 1), []);

  // Tab badge counts — "how many things here need my attention right now."
  // Uses the same status filters each tab defaults to (review / awaiting
  // confirmation), so a badge going to zero always matches what the tab
  // itself would show first.
  useEffect(() => {
    let cancelled = false;

    async function loadCounts() {
      try {
        const [documents, payments] = await Promise.all([
          listDocuments('review', params.id),
          listPayments('awaiting_confirmation', params.id),
        ]);
        if (!cancelled) {
          setPendingDocuments(documents.length);
          setPendingPayments(payments.length);
        }
      } catch {
        // Badge counts are a convenience, not critical — a failed fetch just
        // leaves them at their previous value rather than surfacing an error.
      }
    }

    loadCounts();

    return () => {
      cancelled = true;
    };
  }, [params.id, countsReloadKey]);

  if (loading) {
    return (
      <Box className="flex justify-center py-16">
        <CircularProgress />
      </Box>
    );
  }

  if (loadError || !company) {
    return (
      <>
        <PageHeader title={t('admin.companies_title')} />
        <Alert severity="error">{loadError || t('company.not_found')}</Alert>
      </>
    );
  }

  const tabs = [
    { label: t('company.overview'), href: `/companies/${params.id}` },
    // Documents live inside Journey (each milestone shows its own documents'
    // live status with Verify/Reject right there) rather than a separate
    // tab — same merge client-portal already made for the same reason: it's
    // the same Level > Milestone > Document tree either way, not two pages
    // over the same data. The badge that used to live on a Documents tab
    // moves here since this is now where that action actually happens.
    { label: <TabLabel text={t('nav.journey')} count={pendingDocuments} />, href: `/companies/${params.id}/journey` },
    { label: <TabLabel text={t('nav.payments')} count={pendingPayments} />, href: `/companies/${params.id}/payments` },
  ];
  // Overview's href is a prefix of every other tab's href, so it needs an
  // exact match; the rest are fine with startsWith (nested routes still
  // highlight their tab).
  const activeIndex = tabs.findIndex((tab, i) => (i === 0 ? pathname === tab.href : pathname.startsWith(tab.href)));

  return (
    <CompanyWorkspaceProvider value={{ company, reload, refreshCounts }}>
      <PageHeader
        title={company.name}
        action={<StatusBadge status={company.status} />}
      />

      <Tabs value={activeIndex === -1 ? false : activeIndex} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {tabs.map((tab) => (
          <Tab key={tab.href} label={tab.label} component={Link} href={tab.href} />
        ))}
      </Tabs>

      {children}
    </CompanyWorkspaceProvider>
  );
}
