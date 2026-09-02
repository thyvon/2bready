'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

import { SectionCard } from '@2bready/ui-core';
import { DataTable, type Column } from '@2bready/ui-core';
import StatusBadge from '@/components/ui/StatusBadge';
import PaymentsListView from '@/domains/payment/components/PaymentsListView';
import { useCompanyWorkspace } from '@/domains/company/workspace-context';
import { listCompanySubscriptions, type CompanySubscription } from '@/domains/company/api';
import { formatDate, getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

/** Whole days until expiry (negative = already past; null = no expiry). */
function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

// Tier → i18n key (same labels the journey hero/pricing use).
type TierKey = 'journey.tier_free' | 'journey.tier_starter' | 'journey.tier_pro' | 'journey.tier_enterprise';
const TIER_LABELS: Record<string, TierKey> = {
  free: 'journey.tier_free',
  starter: 'journey.tier_starter',
  pro: 'journey.tier_pro',
  enterprise: 'journey.tier_enterprise',
};

/** Overdue = the nightly sweep hasn't flipped status yet but expires_at has passed. */
function isOverdue(sub: CompanySubscription): boolean {
  if (sub.status !== 'active') return false;
  const remaining = daysUntil(sub.expires_at);
  return remaining !== null && remaining < 0;
}

/**
 * The company workspace's Billing tab — one coherent money view:
 * subscriptions first (the entitlement story: what they hold, what state
 * it's in, when it lapses), payment history below (the transaction story,
 * reusing the same confirm/reject queue component as before).
 */
export default function CompanyBillingPage() {
  const { t } = useTranslation();
  const { company } = useCompanyWorkspace();

  // null = still loading; setState only fires in promise callbacks so the
  // React-Compiler lint never sees a synchronous setState inside the effect.
  const [subs, setSubs] = useState<CompanySubscription[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listCompanySubscriptions(company.id)
      .then((data) => {
        if (!cancelled) setSubs(data);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiError(err).message);
      });
    return () => {
      cancelled = true;
    };
  }, [company.id]);

  const columns: Column<CompanySubscription>[] = [
    {
      key: 'plan',
      label: t('billing.plan_col'),
      render: (sub) => {
        const levelLabel = sub.package?.journey_level_code
          ? `${sub.package.journey_level_code} · ${sub.package.name ?? ''}`
          : sub.package?.name ?? '—';
        return <Typography variant="body2" sx={{ fontWeight: 600 }}>{levelLabel}</Typography>;
      },
    },
    // Subscription type (tier) + duration type (billing period).
    {
      key: 'tier',
      label: t('billing.tier_col'),
      render: (sub) => {
        const tier = sub.package?.tier;
        return tier ? (
          <Chip size="small" variant="outlined" label={t(TIER_LABELS[tier] ?? 'journey.tier_free')} />
        ) : (
          '—'
        );
      },
    },
    {
      key: 'billing_period',
      label: t('billing.period_col'),
      render: (sub) => {
        const period = sub.package?.billing_period;
        if (!period || period === 'one_time') return t('billing.one_time');
        return t(period === 'yearly' ? 'billing.period_yearly' : 'billing.period_monthly');
      },
    },
    { key: 'status', label: t('common.status'), render: (sub) => <StatusBadge status={isOverdue(sub) ? 'expired' : sub.status} /> },
    {
      key: 'started_at',
      label: t('billing.started_col'),
      render: (sub) => (sub.started_at ? formatDate(sub.started_at) : '—'),
    },
    {
      key: 'expires_at',
      label: t('billing.expires_col'),
      render: (sub) => {
        if (!sub.expires_at) return t('billing.no_expiry');
        const remaining = daysUntil(sub.expires_at);
        const overdue = isOverdue(sub);
        return (
          <Box>
            <Typography variant="body2">{formatDate(sub.expires_at)}</Typography>
            <Typography variant="caption" color={overdue ? 'error' : 'text.secondary'}>
              {overdue ? t('billing.expired_ago', { days: Math.abs(remaining ?? 0) }) : t('billing.days_left', { days: remaining ?? 0 })}
            </Typography>
          </Box>
        );
      },
    },
  ];

  return (
    <Box className="flex flex-col gap-6">
      <SectionCard title={t('billing.subscriptions_title')} noPadding>
        {error && (
          <Box className="p-4"><Typography variant="body2" color="error">{error}</Typography></Box>
        )}
        {/* DataTable renders its own loading skeletons and empty state —
            subs stays null until the fetch resolves, which is exactly the
            `loading` flag it expects. */}
        <DataTable
          columns={columns}
          rows={subs ?? []}
          getRowId={(sub) => sub.id}
          loading={subs === null}
          emptyTitle={t('billing.no_subscriptions')}
          emptyDescription={t('billing.no_subscriptions_desc')}
        />
      </SectionCard>

      {/* Payment history — the exact queue that lived on the old Payments
          tab (confirm/reject inline), now the lower half of Billing. */}
      <PaymentsListView companyId={company.id} />
    </Box>
  );
}

