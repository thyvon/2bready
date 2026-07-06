'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import type { Pillar } from '@/lib/journey-data';
import { TIER_LABELS } from '@/lib/journey-data';

export interface PillarCardProps {
  pillar: Pillar;
  icon: React.ReactNode;
  /** Verified document count — 0 for every pillar until real progress exists. */
  verifiedDocs: number;
  /** Free pillar is always unlocked; pro/enterprise pillars are locked until the company upgrades. */
  unlocked: boolean;
}

export function PillarCard({ pillar, icon, verifiedDocs, unlocked }: PillarCardProps) {
  const pct = pillar.totalDocs === 0 ? 0 : Math.round((verifiedDocs / pillar.totalDocs) * 100);

  return (
    <Box
      sx={{
        position: 'relative',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '8px',
        bgcolor: 'background.paper',
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        // Same blue-tinted glow recipe as GlowButton, not a border change —
        // a soft shadow halo instead of a hard outline.
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow:
            '0 0 0 1px color-mix(in srgb, var(--mui-palette-primary-main) 15%, transparent), 0 8px 24px -8px color-mix(in srgb, var(--mui-palette-primary-main) 50%, transparent)',
        },
      }}
    >
      <Box className="flex items-start justify-between">
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '8px',
            bgcolor: 'text.primary',
            color: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& svg': { fontSize: '1.375rem' },
          }}
        >
          {icon}
        </Box>
        <Box
          className="flex items-center gap-1"
          sx={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.03em',
            px: 1.25,
            py: 0.375,
            borderRadius: '9999px',
            ...(unlocked
              ? { bgcolor: 'success.light', color: 'success.dark' }
              : { bgcolor: 'action.selected', color: 'text.secondary' }),
          }}
        >
          {unlocked ? <CheckCircleOutlinedIcon sx={{ fontSize: '0.875rem' }} /> : <LockOutlinedIcon sx={{ fontSize: '0.875rem' }} />}
          {unlocked ? 'UNLOCKED' : TIER_LABELS[pillar.tier]}
        </Box>
      </Box>

      <Box>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary' }}>
          {pillar.label}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
          {pillar.name}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          {pillar.sub}
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, flex: 1 }}>
        {pillar.description}
      </Typography>

      <Box>
        <Box sx={{ height: 6, borderRadius: '4px', bgcolor: 'action.selected', overflow: 'hidden' }}>
          <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: '4px', bgcolor: 'text.primary', transition: 'width 0.4s ease' }} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'text.secondary', fontVariantNumeric: 'tabular-nums', mt: 0.75 }}>
          <span>{pct}%</span>
          <span>{verifiedDocs}/{pillar.totalDocs}</span>
        </Box>
      </Box>
    </Box>
  );
}
