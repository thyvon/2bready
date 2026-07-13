'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { SectionCard } from '@2bready/ui-core';
import { TIER_LABELS, type Tier } from '@/lib/journey-data';
import { LEVEL_EMOJI, type JourneyLevel } from '@/lib/journey-api';

export interface TrustBadgeJourneyProps {
  /** The real journey's levels — empty until a company has an activated journey. */
  levels: JourneyLevel[];
  /** Which levels are unlocked so far, by code — empty until a company completes and can afford Level 1. */
  unlockedLevels: string[];
  /** Real per-level tier, by code, from Package.tier via PackageProvider — not a hardcoded lookup. */
  tierByLevelCode: Record<string, Tier>;
  /** Overall percent across every level's documents, for the bottom track. */
  overallPct: number;
}

export function TrustBadgeJourney({ levels, unlockedLevels, tierByLevelCode, overallPct }: TrustBadgeJourneyProps) {
  return (
    <SectionCard
      title="Your Trust Badge Journey"
      action={
        <Typography
          component={Link}
          href="/journey"
          variant="body2"
          sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          View Full Journey →
        </Typography>
      }
    >
      <Box className="flex flex-col gap-4">
        <Box className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {levels.map((badge) => {
            const unlocked = unlockedLevels.includes(badge.code);
            const tier = tierByLevelCode[badge.code];
            return (
              <Box
                key={badge.code}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {LEVEL_EMOJI[badge.code]} {badge.code} {badge.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {badge.pathway_name} · {tier ? TIER_LABELS[tier] : ''}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, mt: 0.5, color: unlocked ? 'success.main' : tier === 'free' ? 'text.secondary' : 'primary.main' }}
                >
                  {unlocked ? '✅ Unlocked' : tier === 'free' ? '🔒 Not started' : `🔒 Upgrade to ${tier ? TIER_LABELS[tier] : ''}`}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Box sx={{ height: 6, borderRadius: '4px', bgcolor: 'action.selected', overflow: 'hidden' }}>
          <Box sx={{ width: `${overallPct}%`, height: '100%', borderRadius: '4px', bgcolor: 'primary.main' }} />
        </Box>
      </Box>
    </SectionCard>
  );
}
