'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { PillToggle } from '@2bready/ui-core';
import { levelSummary, type LevelPricing, type BillingPeriod } from '@/lib/billing-data';
import { TIER_I18N } from '@/lib/journey-data';
import { formatCents } from '@/lib/utils';
import { useTranslation, type TranslationKey } from '@/lib/i18n';

const PERIOD_LABEL: Record<string, string> = {
  monthly: 'billing.period_monthly',
  yearly: 'billing.period_yearly',
  one_time: '',
};

export type PricingStatus = 'free' | 'active' | 'pending' | 'none';

export interface PricingCardProps {
  pricing: LevelPricing;
  status: PricingStatus;
  loading?: boolean;
  onSelect: () => void;
  /** Optional billing period toggle — when provided, renders a period switcher inside the card. */
  period?: BillingPeriod;
  onPeriodChange?: (period: BillingPeriod) => void;
}

const STATUS_BADGE: Record<Exclude<PricingStatus, 'none'>, string> = {
  free: 'billing.status_always_included',
  active: 'billing.status_active',
  pending: 'billing.status_awaiting_confirmation',
};

const BUTTON_LABEL: Record<Exclude<PricingStatus, 'none'>, string> = {
  free: 'billing.btn_start_free',
  active: 'billing.btn_pathway_active',
  pending: 'billing.btn_awaiting_confirmation',
};

function PricingCardSkeleton() {
  return (
    <Box
      sx={{
        border: '2px solid',
        borderColor: 'divider',
        borderRadius: '12px',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box>
        <Skeleton variant="text" width="50%" height={20} />
        <Skeleton variant="text" width="70%" height={28} />
        <Skeleton variant="text" width="90%" height={16} />
      </Box>
      <Box>
        <Skeleton variant="text" width="40%" height={32} />
        <Skeleton variant="text" width="60%" height={14} />
      </Box>
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {[1, 2, 3].map((i) => (
          <Box key={i} className="flex items-start gap-2">
            <Skeleton variant="rounded" width={18} height={18} sx={{ flexShrink: 0, borderRadius: '4px' }} />
            <Skeleton variant="text" width={`${70 + (i % 3) * 10}%`} height={16} />
          </Box>
        ))}
      </Box>
      <Skeleton variant="rounded" height={40} sx={{ mt: 'auto', borderRadius: '20px' }} />
    </Box>
  );
}

export function PricingCard({ pricing, status, loading = false, onSelect, period, onPeriodChange }: PricingCardProps) {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);

  if (loading) {
    return <PricingCardSkeleton />;
  }

  const { pkg, level } = pricing;
  const isFree = pkg.price_cents === 0;
  const taken = status !== 'none';

  if (loading) {
    return <PricingCardSkeleton />;
  }

  return (
    <Box
      sx={{
        border: '2px solid',
        borderColor: taken ? 'primary.main' : 'divider',
        borderRadius: '12px',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        position: 'relative',
      }}
    >
      {taken && (
        <Box
          sx={{
            position: 'absolute',
            top: -12,
            left: 20,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.03em',
            px: 1.25,
            py: 0.375,
            borderRadius: '9999px',
          }}
        >
          {t(STATUS_BADGE[status as Exclude<PricingStatus, 'none'>] as TranslationKey)}
        </Box>
      )}

      {period && onPeriodChange && (
        <PillToggle
          options={[
            { key: 'yearly', label: t('billing.period_yearly') },
            { key: 'monthly', label: t('billing.period_monthly') },
          ]}
          value={period}
          onChange={(v) => onPeriodChange(v as BillingPeriod)}
          layoutId="pricing-card-period"
        />
      )}

      <Box>
        <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em' }}>
          {level ? `${level.code} · ${t(TIER_I18N[pkg.tier] as TranslationKey)}` : t(TIER_I18N[pkg.tier] as TranslationKey)}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {pkg.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {pkg.description}
        </Typography>
      </Box>

      <Box>
        <Box className="flex items-baseline gap-1">
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {formatCents(pkg.price_cents, 'USD')}
          </Typography>
          {!isFree && (
            <Typography variant="body2" color="text.secondary">
              {t(PERIOD_LABEL[pkg.billing_period] as TranslationKey)}
            </Typography>
          )}
        </Box>
        {level && (
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            {levelSummary(level, t)}
          </Typography>
        )}
      </Box>

      {level && (
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {level.milestones.map((milestone) => (
            <Box key={milestone.id}>
              <Box className="flex items-start gap-2">
                <CheckOutlinedIcon sx={{ fontSize: '1.125rem', color: 'success.main', flexShrink: 0, mt: '1px' }} />
                <Typography variant="body2">{milestone.name}</Typography>
              </Box>
              {showDetails && milestone.documents.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 3.5, mt: 0.5 }}>
                  {milestone.documents.map((doc) => (
                    <Box key={doc.id} className="flex items-center gap-1.5" sx={{ pl: 1.25, borderLeft: '2px solid', borderColor: 'divider' }}>
                      <DescriptionOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.secondary">
                        {doc.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ))}
          {level.milestones.some((m) => m.documents.length > 0) && (
            <Box
              onClick={() => setShowDetails((v) => !v)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                userSelect: 'none',
                mt: 0.5,
                color: showDetails ? 'primary.main' : 'text.secondary',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              {showDetails ? t('billing.hide_details') : t('billing.show_details')}
              <ExpandMoreIcon
                sx={{
                  fontSize: 16,
                  transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: showDetails ? 'rotate(180deg)' : 'none',
                }}
              />
            </Box>
          )}
        </Box>
      )}

      <Box sx={{ mt: 'auto', pt: 1 }}>
        {taken ? (
          <Button variant="outlined" fullWidth disabled>
            {t(BUTTON_LABEL[status as Exclude<PricingStatus, 'none'>] as TranslationKey)}
          </Button>
        ) : (
          <Button variant="contained" fullWidth onClick={onSelect}>
            {t('billing.btn_select_pathway')}
          </Button>
        )}
      </Box>
    </Box>
  );
}
