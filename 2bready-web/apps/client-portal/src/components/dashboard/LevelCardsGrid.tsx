'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import { motion } from 'framer-motion';

import type { Journey, JourneyLevel } from '@/lib/journey-api';
import { levelVerifiedDocs, levelTotalDocs } from '@/lib/journey-api';
import { cardGridContainer, cardGridItem } from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';
import { marketingUrl } from '@/lib/marketing-url';

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

export interface LevelBadgeLink {
  /** Certificate PDF signed URL — null until the audit is approved. */
  pdfUrl: string | null;
  /** The approved audit id — builds this environment's verify URL. */
  auditId: string;
}

interface LevelCardsGridProps {
  journey: Journey;
  /** Level codes covered by one of the company's ACTIVE subscriptions. */
  activeLevelCodes: Set<string>;
  /** Earned badges keyed by level code — powers the Certificate/Report buttons. */
  badgesByLevel?: Map<string, LevelBadgeLink>;
}

/**
 * The Overview mockup's 2×2 journey-level grid (L1–L4). Levels are re-bucketed
 * from `journey.levels` by code — they arrive sorted by sort_order across all
 * pillars, which is exactly the reading order this view wants.
 */
export function LevelCardsGrid({ journey, activeLevelCodes, badgesByLevel }: LevelCardsGridProps) {
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
        <LevelCard
          key={level.id}
          level={level}
          pct={pct}
          isActivePlan={activeLevelCodes.has(level.code)}
          badge={badgesByLevel?.get(level.code)}
        />
      ))}
    </motion.div>
  );

  function LevelCard({
    level,
    pct,
    isActivePlan,
    badge,
  }: {
    level: JourneyLevel;
    pct: number;
    isActivePlan: boolean;
    badge?: LevelBadgeLink;
  }) {
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

    const complete = pct === 100;

    // A completed level sticks its two payoff actions on the card: the
    // certificate PDF (once its audit is approved) and the public
    // verification report.
    // Defensive against stale HMR state: no audit id -> no deep link.
    const verifyReportUrl = badge?.auditId ? marketingUrl(`/verify/${badge.auditId}`) : '/audits';

    const actions =
      complete && badgesByLevel ? (
        <Box className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Tooltip title={badge?.pdfUrl ? t('overview.view_certificate') : t('overview.certificate_locked_hint')}>
            <span>
              <Button
                size="small"
                variant="outlined"
                startIcon={<WorkspacePremiumOutlinedIcon fontSize="small" />}
                href={badge?.pdfUrl ?? '/trust-badge'}
                target={badge?.pdfUrl ? '_blank' : undefined}
                component={badge?.pdfUrl ? 'a' : 'button'}
                sx={{ minWidth: 0 }}
              >
                {t('overview.certificate_btn')}
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={t('overview.view_report')}>
            <Button
              size="small"
              variant="text"
              startIcon={<BarChartOutlinedIcon fontSize="small" />}
              href={verifyReportUrl}
              target={badge?.auditId ? '_blank' : undefined}
              component={badge?.auditId ? 'a' : 'button'}
              sx={{ minWidth: 0 }}
            >
              {t('overview.report_btn')}
            </Button>
          </Tooltip>
        </Box>
      ) : null;

    return (
      <motion.div variants={cardGridItem} style={{ height: '100%' }}>
        <Box
          onClick={() => router.push('/journey')}
          className="h-full flex flex-col gap-3"
          sx={{
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
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
          <Box className="flex items-start justify-between gap-2">
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {OVERVIEW_LEVEL_EMOJI[level.code] ?? '🔶'} {level.code}: {level.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">{level.pathway_name}</Typography>
            </Box>
            {actions}
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
