'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import { SectionCard, GlowButton, cardGridContainer, cardGridItem } from '@2bready/ui-core';
import { PillarCard } from '@/components/dashboard/PillarCard';
import { JourneyTree } from '@/components/dashboard/JourneyTree';
import { TrustJourneyHero } from '@/components/dashboard/TrustJourneyHero';
import { PageLoader } from '@/components/PageLoader';
import { PILLARS } from '@/lib/journey-data';
import { useJourney } from '@/components/JourneyProvider';
import { usePackages } from '@/components/PackageProvider';
import { tierByLevelCode } from '@/lib/package-api';
import { allDocuments, pillarDocuments, pillarLevels, countVerified, levelTotalDocs, levelVerifiedDocs, toDocStatus } from '@/lib/journey-api';

const PILLAR_ICONS = {
  comply: <ShieldOutlinedIcon fontSize="small" />,
  scale: <TrendingUpOutlinedIcon fontSize="small" />,
  lead: <WorkspacePremiumOutlinedIcon fontSize="small" />,
};

// Same lift + glow hover as PillarCard, applied to every other card on this
// page so hovering anything on Overview feels like one consistent surface,
// not just the pillar grid. Passed via SectionCard's opt-in `sx` — other
// pages' SectionCard usages are untouched.
const cardHoverSx = {
  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow:
      '0 0 0 1px color-mix(in srgb, var(--mui-palette-primary-main) 18%, transparent), 0 20px 40px -16px color-mix(in srgb, var(--mui-palette-primary-main) 30%, transparent)',
  },
};

export default function OverviewPage() {
  const { journey, loading } = useJourney();
  const { packages } = usePackages();
  const tierMap = useMemo(() => tierByLevelCode(packages), [packages]);

  if (loading) return <PageLoader />;

  const documents = allDocuments(journey);
  const totalDocs = documents.length;
  const verifiedDocs = countVerified(documents);
  const overallPct = totalDocs === 0 ? 0 : Math.round((verifiedDocs / totalDocs) * 100);
  const pendingDocs = totalDocs - verifiedDocs;

  // Scoped to the comply pillar specifically, not "last unlocked across every
  // pillar" — scale/lead each always unlock their own first level too (an
  // upgrade-gated entry point, not real progress), so that would surface e.g.
  // "L4" the moment a company exists, regardless of actual document
  // progress. Comply is the one pathway every company is actually on before
  // upgrading, matching the "current stage" section below. Every level is a
  // paid tier now (L1 is Starter), so with no active subscription nothing is
  // unlocked and currentLevel falls back to '—'.
  const complyLevels = pillarLevels(journey, 'comply');
  const unlockedComplyLevels = complyLevels.filter((level) => level.unlocked);
  const currentLevel = unlockedComplyLevels.length > 0 ? unlockedComplyLevels[unlockedComplyLevels.length - 1].code : '—';

  // The "current stage" section below always shows the comply pillar's
  // first level — the entry point every company starts from. Locked until
  // their L1 (Starter) subscription is active; the tree surfaces the real
  // state via `isUnlocked`, including the Upgrade CTA for locked L1.
  const complyLevel = complyLevels[0] ?? null;
  const complyTotalDocs = complyLevel ? levelTotalDocs(complyLevel) : 0;
  const complyVerifiedDocs = complyLevel ? levelVerifiedDocs(complyLevel) : 0;

  // Real tax-compliance document count, found by milestone name rather than
  // a hardcoded array index — matches whatever the current level's real
  // milestone taxonomy actually contains.
  const taxMilestone = complyLevel?.milestones.find((m) => m.name === 'Tax Compliance') ?? null;
  const taxDocsPending = taxMilestone ? taxMilestone.documents.filter((doc) => toDocStatus(doc.status) !== 'verified').length : 0;

  // The single next actionable document in the comply level, in milestone
  // order — replaces a permanently-fixed "Upload MoC Registration" card
  // with whatever's actually next, and disappears once nothing's pending.
  const nextDocument = (() => {
    if (!complyLevel) return null;
    for (const milestone of complyLevel.milestones) {
      for (const doc of milestone.documents) {
        if (toDocStatus(doc.status) !== 'verified') return { doc, milestone };
      }
    }
    return null;
  })();

  return (
    <Box className="flex flex-col gap-6">
      <TrustJourneyHero overallPct={overallPct} currentLevel={currentLevel} pendingDocs={pendingDocs} />

      {/* Three at-a-glance insight cards — Audit-Ready reuses the same
          overallPct as the hero above (one real metric, shown twice). */}
      <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SectionCard sx={cardHoverSx}>
          <Box className="flex items-center gap-2" sx={{ mb: 1 }}>
            <CheckCircleOutlinedIcon sx={{ fontSize: '1.125rem', color: 'success.main' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>
              Tax Health
            </Typography>
          </Box>
          <Box className="flex items-center gap-1.5">
            <WarningAmberOutlinedIcon sx={{ fontSize: '1.125rem', color: 'warning.main' }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'warning.dark' }}>
              {taxDocsPending} tax documents pending
            </Typography>
          </Box>
        </SectionCard>

        <SectionCard sx={cardHoverSx}>
          <Box className="flex items-center gap-2" sx={{ mb: 1 }}>
            <BarChartOutlinedIcon sx={{ fontSize: '1.125rem', color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>
              Audit-Ready
            </Typography>
          </Box>
          <Box sx={{ height: 6, borderRadius: '4px', bgcolor: 'action.selected', overflow: 'hidden' }}>
            <Box sx={{ width: `${overallPct}%`, height: '100%', borderRadius: '4px', bgcolor: 'primary.main', transition: 'width 0.4s ease' }} />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
            {overallPct}%
          </Typography>
        </SectionCard>

        <SectionCard sx={cardHoverSx}>
          <Box className="flex items-center gap-2" sx={{ mb: 1 }}>
            <PushPinOutlinedIcon sx={{ fontSize: '1.125rem', color: 'error.main' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>
              Next Milestone
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {pendingDocs} documents need attention
          </Typography>
        </SectionCard>
      </Box>

      {/* 3 pillars — Comply (starter, paid like every level), Scale (pro),
          Lead (enterprise). `unlocked` reflects the real per-level
          `level.unlocked` from the API (subscription tier + milestone-progress
          chain, see JourneyProgressService) — a pillar shows unlocked once its
          first level does, same signal activeLevelCodes below already uses. */}
      <motion.div variants={cardGridContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PILLARS.map((pillar) => {
          const docs = pillarDocuments(journey, pillar.id);
          const levels = pillarLevels(journey, pillar.id);
          return (
            <motion.div key={pillar.id} variants={cardGridItem} style={{ height: '100%' }}>
              <PillarCard
                pillar={pillar}
                icon={PILLAR_ICONS[pillar.id]}
                verifiedDocs={countVerified(docs)}
                totalDocs={docs.length}
                activeLevelCodes={levels.filter((level) => level.unlocked).map((level) => level.code)}
                unlocked={levels.some((level) => level.unlocked)}
              />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Current stage — the comply pillar's first (and so far only) level,
          the entry point every company starts on. Every level is a paid tier
          now (L1 is Starter), so it stays locked — with its Upgrade CTA —
          until the company's L1 subscription is active. Reuses JourneyTree
          (scoped to just this one level) instead of re-implementing the
          milestone/document list by hand. */}
      {complyLevel && (
        <SectionCard
          title={`${complyLevel.code} · ${complyLevel.pathway_name} — ${complyLevel.name}`}
          subtitle={`${complyVerifiedDocs}/${complyTotalDocs} verified`}
          sx={cardHoverSx}
        >
          <JourneyTree
            levels={[complyLevel]}
            isUnlocked={(level) => level.unlocked}
            tierFor={(level) => tierMap[level.code]}
          />
          <Box sx={{ mt: 2 }}>
            <GlowButton href="/journey" size="medium">
              View All Documents
            </GlowButton>
          </Box>
        </SectionCard>
      )}

      {/* Next best action — the single highest-priority thing to do right
          now; differentiated from the softer nudge card below by icon
          weight (solid dark badge here vs. a lighter one there), not a
          border accent. Disappears once nothing in the comply level is
          pending, rather than showing stale fixed copy. */}
      {nextDocument && (
        <SectionCard sx={cardHoverSx}>
          <Box className="flex items-center gap-4">
            <Box sx={{ width: 40, height: 40, borderRadius: '8px', bgcolor: 'text.primary', color: 'background.paper', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <DescriptionOutlinedIcon fontSize="small" />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Upload {nextDocument.doc.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Part of the {nextDocument.milestone.name} milestone in {complyLevel?.code} · {complyLevel?.pathway_name}.
              </Typography>
            </Box>
            <GlowButton href="/journey" size="medium">
              Upload →
            </GlowButton>
          </Box>
        </SectionCard>
      )}

      {/* Growth nudge — mirrors the owner concept's ADMIT upsell, which only
          appears after 14 days of zero progress; shown here as a static
          preview state since there's no account-age tracking yet. */}
      <SectionCard sx={cardHoverSx}>
        <Box className="flex items-center gap-4">
          <Box sx={{ width: 40, height: 40, borderRadius: '8px', bgcolor: 'action.selected', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <LightbulbOutlinedIcon fontSize="small" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Stuck getting started?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ADMIT Unit&apos;s compliance experts can prepare your L1 documents for you — book a free consultation.
            </Typography>
          </Box>
          <GlowButton href="/support" size="medium">
            Request Consultation
          </GlowButton>
        </Box>
      </SectionCard>
    </Box>
  );
}
