'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { motion } from 'framer-motion';

import type { Journey, JourneyLevel } from '@/lib/journey-api';
import { levelVerifiedDocs, levelTotalDocs } from '@/lib/journey-api';
import { cardGridContainer, cardGridItem } from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';

// Per-level marketing emoji + description keys (explicit so the i18n dict
// typing stays exact) — matches the Overview mockup. Distinct from
// journey-api's medal-style LEVEL_EMOJI used inside JourneyTree.
const OVERVIEW_LEVEL_EMOJI: Record<string, string> = { L1: '🛡️', L2: '⚙️', L3: '📦', L4: '🌍' };

type LevelDescKey = 'journey.level_l1_desc' | 'journey.level_l2_desc' | 'journey.level_l3_desc' | 'journey.level_l4_desc';
const LEVEL_DESC_KEYS: Record<string, LevelDescKey> = {
  L1: 'journey.level_l1_desc',
  L2: 'journey.level_l2_desc',
  L3: 'journey.level_l3_desc',
  L4: 'journey.level_l4_desc',
};

interface LevelCardsGridProps {
  journey: Journey;
  /** Level codes covered by one of the company's ACTIVE subscriptions. */
  activeLevelCodes: Set<string>;
}

/**
 * The Overview mockup's 2×2 journey-level grid (L1–L4). Levels are re-bucketed
 * from `journey.levels` by code — they arrive sorted by sort_order across all
 * pillars, which is exactly the reading order this view wants.
 */
export function LevelCardsGrid({ journey, activeLevelCodes }: LevelCardsGridProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const cards = useMemo(
    () =>
      journey.levels.map((level) => {
        const total = levelTotalDocs(level);
        const verified = levelVerifiedDocs(level);
        return { level, pct: total === 0 ? 0 : Math.round((verified / total) * 100) };
      }),
    [journey],
  );

  return (
    <motion.div variants={cardGridContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cards.map(({ level, pct }) => (
        <LevelCard key={level.id} level={level} pct={pct} isActivePlan={activeLevelCodes.has(level.code)} />
      ))}
    </motion.div>
  );

  function LevelCard({ level, pct, isActivePlan }: { level: JourneyLevel; pct: number; isActivePlan: boolean }) {
    const chip = isActivePlan ? (
      <Chip size="small" color="success" variant="outlined" label={t('journey.active_plan')} />
    ) : level.unlocked ? (
      <Chip size="small" variant="outlined" label={t('journey.unlocked')} />
    ) : (
      // Locked levels upsell straight to the billing page.
      <Link href="/billing">
        <Chip
          size="small"
          icon={<LockOutlinedIcon fontSize="small" />}
          variant="outlined"
          label={t('journey.upgrade')}
          onClick={(e) => e.stopPropagation()}
        />
      </Link>
    );

    return (
      <motion.div variants={cardGridItem} style={{ height: '100%' }}>
        <Box
          onClick={() => router.push('/journey')}
          className="h-full flex flex-col gap-3"
          sx={{
            // Old PillarCard background kept (paper-to-tint gradient) — but
            // flat: no lift/glow hover, no elevated shadow.
            borderRadius: '8px',
            p: 2.5,
            background:
              'linear-gradient(160deg, var(--mui-palette-background-paper) 0%, color-mix(in srgb, var(--mui-palette-primary-main) 5%, var(--mui-palette-background-paper)) 100%)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {OVERVIEW_LEVEL_EMOJI[level.code] ?? '🔶'} {level.code}: {level.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">{level.pathway_name}</Typography>
          </Box>

          <Box className="flex items-center justify-between gap-2">
            <Typography variant="body2" sx={{ fontWeight: 600 }}>({pct}%)</Typography>
            {chip}
          </Box>

          <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover', overflow: 'hidden' }}>
            <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 3, bgcolor: 'success.main' }} />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 'auto' }}>
            {t(LEVEL_DESC_KEYS[level.code] ?? 'journey.level_l1_desc')}
          </Typography>
        </Box>
      </motion.div>
    );
  }
}
