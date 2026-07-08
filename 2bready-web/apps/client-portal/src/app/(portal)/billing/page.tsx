'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { Breadcrumbs, SectionCard, EmptyState } from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';
import { useNavItems } from '@/components/layout/nav-items';
import { PricingCard } from '@/components/dashboard/PricingCard';
import { LEVEL_PRICING } from '@/lib/billing-data';
import type { LevelCode } from '@/lib/journey-data';

// Per-level pricing, matching Landing Page_2bReady-9.html's "Standardized
// Service Pathways" (Project Documents/) rather than a flat subscription
// tier — each level is its own purchasable pathway (annual price + a
// separate manual audit fee), not bundled. No payment API is wired up yet,
// so purchasing is local-only (same demo pattern as the Audits hire flow) —
// it changes what this page shows, not a real charge. L1 is always "active"
// since it's free with no audit fee.
export default function BillingPage() {
  const { t } = useTranslation();
  const { all } = useNavItems();
  const item = all.find((i) => i.href === '/billing');

  const [purchased, setPurchased] = useState<Set<LevelCode>>(new Set(['L1']));

  return (
    <Box className="flex flex-col gap-6">
      <Breadcrumbs
        icon={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '8px',
              bgcolor: 'text.primary',
              color: 'background.paper',
              flexShrink: 0,
            }}
          >
            {item?.icon}
          </Box>
        }
        items={[{ label: t('nav.overview'), href: '/' }, { label: item?.label ?? 'Billing' }]}
      />

      <Typography variant="body2" color="text.secondary">
        Progress your enterprise from foundational legal licensing to institutional investment readiness. Each
        pathway is priced and verified independently — select only the levels you need.
      </Typography>

      <SectionCard title="Standardized Service Pathways" subtitle="Billed annually, plus a one-time manual audit fee per level">
        <Box className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {LEVEL_PRICING.map((pricing) => (
            <PricingCard
              key={pricing.level.level}
              pricing={pricing}
              purchased={purchased.has(pricing.level.level)}
              onSelect={() => setPurchased((prev) => new Set(prev).add(pricing.level.level))}
            />
          ))}
        </Box>
      </SectionCard>

      <SectionCard title="Payment History">
        <EmptyState
          icon={<ReceiptLongOutlinedIcon fontSize="inherit" />}
          title="No payment history yet"
          description="Invoices and receipts will appear here once you select a paid pathway."
        />
      </SectionCard>
    </Box>
  );
}
