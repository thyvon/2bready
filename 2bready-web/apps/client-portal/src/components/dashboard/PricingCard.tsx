'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import { levelSummary, type LevelPricing } from '@/lib/billing-data';

function formatPrice(cents: number): string {
  return cents === 0 ? '$0' : `$${(cents / 100).toFixed(0)}`;
}

export interface PricingCardProps {
  pricing: LevelPricing;
  purchased: boolean;
  onSelect: () => void;
}

export function PricingCard({ pricing, purchased, onSelect }: PricingCardProps) {
  const { level, annualPriceCents, auditFeeCents } = pricing;
  const isFree = annualPriceCents === 0;

  return (
    <Box
      sx={{
        border: '2px solid',
        borderColor: purchased ? 'primary.main' : 'divider',
        borderRadius: '12px',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        position: 'relative',
      }}
    >
      {purchased && (
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
          {isFree ? 'ALWAYS INCLUDED' : 'ACTIVE'}
        </Box>
      )}

      <Box>
        <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em' }}>
          {level.level}: {level.name}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {level.pathwayName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {levelSummary(level)}
        </Typography>
      </Box>

      <Box>
        <Box className="flex items-baseline gap-1">
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {formatPrice(annualPriceCents)}
          </Typography>
          {!isFree && (
            <Typography variant="body2" color="text.secondary">
              /yr
            </Typography>
          )}
        </Box>
        <Typography variant="caption" sx={{ fontWeight: 600, color: isFree ? 'success.main' : 'text.secondary' }}>
          {isFree ? 'No verification fee' : `+ ${formatPrice(auditFeeCents)} manual audit fee`}
        </Typography>
      </Box>

      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {level.milestones.map((milestone) => (
          <Box key={milestone.name} className="flex items-start gap-2">
            <CheckOutlinedIcon sx={{ fontSize: '1.125rem', color: 'success.main', flexShrink: 0, mt: '1px' }} />
            <Typography variant="body2">{milestone.name}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 'auto', pt: 1 }}>
        {purchased ? (
          <Button variant="outlined" fullWidth disabled>
            {isFree ? 'Start Free' : 'Pathway Active'}
          </Button>
        ) : (
          <Button variant="contained" fullWidth onClick={onSelect}>
            Select Pathway
          </Button>
        )}
      </Box>
    </Box>
  );
}
