'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import { levelSummary, type LevelPricing } from '@/lib/billing-data';
import { TIER_LABELS } from '@/lib/journey-data';

function formatPrice(cents: number): string {
  return cents === 0 ? '$0' : `$${(cents / 100).toFixed(0)}`;
}

const PERIOD_LABEL: Record<string, string> = {
  monthly: '/mo',
  yearly: '/yr',
  one_time: '',
};

// Real subscription granularity, not a blind boolean — 'pending' (subscribed,
// bank transfer not yet confirmed by finance) reads very differently from
// 'active' (confirmed, the level is genuinely unlocked).
export type PricingStatus = 'free' | 'active' | 'pending' | 'none';

export interface PricingCardProps {
  pricing: LevelPricing;
  status: PricingStatus;
  loading?: boolean;
  onSelect: () => void;
}

const STATUS_BADGE: Record<Exclude<PricingStatus, 'none'>, string> = {
  free: 'ALWAYS INCLUDED',
  active: 'ACTIVE',
  pending: 'AWAITING CONFIRMATION',
};

const BUTTON_LABEL: Record<Exclude<PricingStatus, 'none'>, string> = {
  free: 'Start Free',
  active: 'Pathway Active',
  pending: 'Awaiting Confirmation',
};

export function PricingCard({ pricing, status, loading = false, onSelect }: PricingCardProps) {
  const { pkg, level } = pricing;
  const isFree = pkg.price_cents === 0;
  const taken = status !== 'none';

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
          {STATUS_BADGE[status as Exclude<PricingStatus, 'none'>]}
        </Box>
      )}

      <Box>
        <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em' }}>
          {level ? `${level.code} · ${TIER_LABELS[pkg.tier]}` : TIER_LABELS[pkg.tier]}
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
            {formatPrice(pkg.price_cents)}
          </Typography>
          {!isFree && (
            <Typography variant="body2" color="text.secondary">
              {PERIOD_LABEL[pkg.billing_period]}
            </Typography>
          )}
        </Box>
        {level && (
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            {levelSummary(level)}
          </Typography>
        )}
      </Box>

      {level && (
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {level.milestones.map((milestone) => (
            <Box key={milestone.id} className="flex items-start gap-2">
              <CheckOutlinedIcon sx={{ fontSize: '1.125rem', color: 'success.main', flexShrink: 0, mt: '1px' }} />
              <Typography variant="body2">{milestone.name}</Typography>
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ mt: 'auto', pt: 1 }}>
        {taken ? (
          <Button variant="outlined" fullWidth disabled>
            {BUTTON_LABEL[status as Exclude<PricingStatus, 'none'>]}
          </Button>
        ) : (
          <Button variant="contained" fullWidth loading={loading} onClick={onSelect}>
            Select Pathway
          </Button>
        )}
      </Box>
    </Box>
  );
}
