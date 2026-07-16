'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { useTranslation } from '@/lib/i18n';
import type { Pillar, Tier } from '../pillars';
import { RadialMeter } from './RadialMeter';

export interface PillarCardProps {
  pillar: Pillar;
  icon: React.ReactNode;
  /** Real verified document count for this pillar, computed by the caller from the live journey. */
  verifiedDocs: number;
  totalDocs: number;
  /** Real unlocked level codes for this pillar, computed by the caller — shown as informational text only. */
  activeLevelCodes: string[];
  /** Whether the company's subscription + milestone progress has unlocked at least one level in this pillar — from the real `level.unlocked` field, not a static tier check (see the plan-vs-level bug this exact mistake caused on client-portal). */
  unlocked: boolean;
}

// One hue per tier, escalating — ported from client-portal's PillarCard
// (components/dashboard) unchanged.
const TIER_ACCENT: Record<Tier, string> = {
  free: 'var(--mui-palette-text-primary)',
  pro: 'var(--mui-palette-primary-main)',
  enterprise: '#b8860b',
};

export function PillarCard({ pillar, icon, verifiedDocs, totalDocs, activeLevelCodes, unlocked }: PillarCardProps) {
  const { t } = useTranslation();
  const pct = totalDocs === 0 ? 0 : Math.round((verifiedDocs / totalDocs) * 100);
  const levels = activeLevelCodes.join(' · ');
  const accent = TIER_ACCENT[pillar.tier];

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
        p: 2.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        background: `linear-gradient(160deg, var(--mui-palette-background-paper) 0%, color-mix(in srgb, ${accent} 5%, var(--mui-palette-background-paper)) 100%)`,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -12px rgba(16,24,40,0.10)',
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: `0 0 0 1px color-mix(in srgb, ${accent} 18%, transparent), 0 20px 40px -16px color-mix(in srgb, ${accent} 30%, transparent)`,
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          right: -18,
          bottom: -18,
          fontSize: '7.5rem',
          lineHeight: 1,
          color: 'text.primary',
          opacity: 0.03,
          pointerEvents: 'none',
          '& svg': { fontSize: 'inherit' },
        }}
      >
        {icon}
      </Box>

      <Box className="flex items-start justify-between" sx={{ position: 'relative' }}>
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
            boxShadow: `0 4px 16px -4px color-mix(in srgb, ${accent} 45%, transparent)`,
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
          {unlocked ? t('journey.unlocked') : t(`journey.tier_${pillar.tier}`)}
        </Box>
      </Box>

      <Box className="flex items-center gap-3" sx={{ position: 'relative' }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent }}>
            {t(`journey.pillar_${pillar.id}_label`)}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
            {t(`journey.pillar_${pillar.id}_name`)}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            {t(`journey.pillar_${pillar.id}_sub`)}
            {unlocked ? ` · ${levels}` : ''}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            {verifiedDocs}/{totalDocs}
          </Typography>
        </Box>
        <RadialMeter percent={pct} size={80} strokeWidth={7} trackColor="var(--mui-palette-action-selected)" fillColor={accent} />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, flex: 1, position: 'relative' }}>
        {t(`journey.pillar_${pillar.id}_description`)}
      </Typography>
    </Box>
  );
}
