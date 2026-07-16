'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import type { Pillar, Tier } from '@/lib/journey-data';
import { TIER_LABELS } from '@/lib/journey-data';
import { RadialMeter } from './RadialMeter';

export interface PillarCardProps {
  pillar: Pillar;
  icon: React.ReactNode;
  /** Real verified document count for this pillar, computed by the caller from the live journey. */
  verifiedDocs: number;
  /** Real total document count for this pillar — no longer a fixed field on Pillar itself, since it now comes from the live journey, not a hardcoded taxonomy. */
  totalDocs: number;
  /** Real unlocked level codes for this pillar (journey progress), computed by the caller — shown as informational text only, not a gate. */
  activeLevelCodes: string[];
  /** Whether the company's paid subscription (+ milestone progress) has unlocked at least one level in this pillar — computed by the caller from the real `level.unlocked` field, not a static tier lookup. */
  unlocked: boolean;
}

// One hue per tier, escalating — Normal stays monochrome (the plain,
// default tier), Pro picks up the app's own brand blue (a real step up),
// Enterprise gets a gold accent (the universal "top tier" signal, from
// Amex/airline-status cards to SaaS pricing pages) — not a full theme
// change, just this one card's accent, so it stays a deliberate exception
// rather than a second brand color creeping in everywhere.
const TIER_ACCENT: Record<Tier, string> = {
  free: 'var(--mui-palette-text-primary)',
  pro: 'var(--mui-palette-primary-main)',
  enterprise: '#b8860b',
};

// Premium-but-light — a subtle paper-to-tint gradient, a soft elevated
// shadow, a glowing icon badge, and a quiet icon watermark instead of the
// flat single-color card this replaced. Built on theme tokens (not
// hardcoded hex) apart from the one gold accent above, so it stays correct
// if the app's own dark-mode toggle is ever used — the owner's actual
// preference is a light interface, this just gives the light card real
// presence rather than reaching for a dark "black card" look.
export function PillarCard({ pillar, icon, verifiedDocs, totalDocs, activeLevelCodes, unlocked }: PillarCardProps) {
  const pct = totalDocs === 0 ? 0 : Math.round((verifiedDocs / totalDocs) * 100);
  const levels = activeLevelCodes.join(' · ');
  const accent = TIER_ACCENT[pillar.tier];

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        // Matches the theme's own MuiCard override (SectionCard etc.) — one
        // radius token across every card-shaped surface, not a one-off value.
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
      {/* Oversized, near-invisible watermark of the pillar's own icon — a
          quiet "engraving" rather than a busy decorative pattern. */}
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
          {unlocked ? 'UNLOCKED' : TIER_LABELS[pillar.tier]}
        </Box>
      </Box>

      <Box className="flex items-center gap-3" sx={{ position: 'relative' }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent }}>
            {pillar.label}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
            {pillar.name}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            {pillar.sub}
            {unlocked ? ` · ${levels}` : ''}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            {verifiedDocs}/{totalDocs}
          </Typography>
        </Box>
        <RadialMeter
          percent={pct}
          size={80}
          strokeWidth={7}
          trackColor="var(--mui-palette-action-selected)"
          fillColor={accent}
        />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, flex: 1, position: 'relative' }}>
        {pillar.description}
      </Typography>
    </Box>
  );
}
