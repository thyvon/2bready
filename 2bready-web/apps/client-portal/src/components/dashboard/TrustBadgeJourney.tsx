'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { SectionCard } from '@2bready/ui-core';
import { BADGE_LEVELS, TIER_LABELS } from '@/lib/journey-data';

export interface TrustBadgeJourneyProps {
  /** Which levels are unlocked so far — empty until a company completes and can afford Level 1. */
  unlockedLevels: Array<(typeof BADGE_LEVELS)[number]['level']>;
  /** Overall percent across every level's documents, for the bottom track. */
  overallPct: number;
}

export function TrustBadgeJourney({ unlockedLevels, overallPct }: TrustBadgeJourneyProps) {
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
          {BADGE_LEVELS.map((badge) => {
            const unlocked = unlockedLevels.includes(badge.level);
            return (
              <Box
                key={badge.level}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {badge.emoji} {badge.level} {badge.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {badge.pathwayName} · {TIER_LABELS[badge.tier]}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, mt: 0.5, color: unlocked ? 'success.main' : badge.tier === 'free' ? 'text.secondary' : 'primary.main' }}
                >
                  {unlocked ? '✅ Unlocked' : badge.tier === 'free' ? '🔒 Not started' : `🔒 Upgrade to ${TIER_LABELS[badge.tier]}`}
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
