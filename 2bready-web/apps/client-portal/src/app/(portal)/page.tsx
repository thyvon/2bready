'use client';

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
import { PILLARS, BADGE_LEVELS, levelDocCount } from '@/lib/journey-data';

const L1 = [BADGE_LEVELS[0]];
const TOTAL_DOCS = BADGE_LEVELS.reduce((sum, level) => sum + levelDocCount(level), 0);
const TAX_COMPLIANCE_DOCS = L1[0].milestones.find((m) => m.name === 'Tax Compliance')!.docs.length;

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
  return (
    <Box className="flex flex-col gap-6">
      <TrustJourneyHero overallPct={0} currentLevel="L1" pendingDocs={TOTAL_DOCS} />

      {/* Three at-a-glance insight cards — same "honest zero" data as
          everywhere else in the app, not the reference mockup's own
          placeholder numbers. */}
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
              {TAX_COMPLIANCE_DOCS} tax documents pending
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
            <Box sx={{ width: '0%', height: '100%', borderRadius: '4px', bgcolor: 'primary.main' }} />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
            0%
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
            {TOTAL_DOCS} documents need attention
          </Typography>
        </SectionCard>
      </Box>

      {/* 3 pillars — Comply (free, always unlocked), Scale (pro), Lead (enterprise) */}
      <motion.div variants={cardGridContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PILLARS.map((pillar) => (
          <motion.div key={pillar.id} variants={cardGridItem}>
            <PillarCard pillar={pillar} icon={PILLAR_ICONS[pillar.id]} verifiedDocs={0} unlocked={pillar.tier === 'free'} />
          </motion.div>
        ))}
      </motion.div>

      {/* Current stage: L1 · The Launchpad, the only pathway on the free
          tier — reuses JourneyTree (scoped to just this one level) instead
          of re-implementing the milestone/document list by hand. */}
      <SectionCard title="L1 · The Launchpad — Bronze Foundation" subtitle="0/13 verified" sx={cardHoverSx}>
        <JourneyTree levels={L1} isUnlocked={() => true} />
        <Box sx={{ mt: 2 }}>
          <GlowButton href="/journey" size="medium">
            View All Documents
          </GlowButton>
        </Box>
      </SectionCard>

      {/* Next best action — the single highest-priority thing to do right
          now; differentiated from the softer nudge card below by icon
          weight (solid dark badge here vs. a lighter one there), not a
          border accent. */}
      <SectionCard sx={cardHoverSx}>
        <Box className="flex items-center gap-4">
          <Box sx={{ width: 40, height: 40, borderRadius: '8px', bgcolor: 'text.primary', color: 'background.paper', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <DescriptionOutlinedIcon fontSize="small" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Upload MoC Registration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The first document to verify in L1 · The Launchpad. Required before your company can move to Tax Compliance.
            </Typography>
          </Box>
          <GlowButton href="/journey" size="medium">
            Upload →
          </GlowButton>
        </Box>
      </SectionCard>

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
