'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import { SectionCard, GlowButton, cardGridContainer, cardGridItem } from '@2bready/ui-core';
import { PillarCard } from '@/components/dashboard/PillarCard';
import { TrustBadgeJourney } from '@/components/dashboard/TrustBadgeJourney';
import { JourneyTree } from '@/components/dashboard/JourneyTree';
import { PILLARS, BADGE_LEVELS } from '@/lib/journey-data';

const L1 = [BADGE_LEVELS[0]];

const PILLAR_ICONS = {
  comply: <ShieldOutlinedIcon fontSize="small" />,
  scale: <TrendingUpOutlinedIcon fontSize="small" />,
  lead: <WorkspacePremiumOutlinedIcon fontSize="small" />,
};

const ECOSYSTEM = [
  { icon: <StorefrontOutlinedIcon fontSize="small" />, name: '2bgro Commerce', desc: 'B2B commerce channels unlocked by your L2 Product Excellence badge.' },
  { icon: <LocalShippingOutlinedIcon fontSize="small" />, name: '2bShip Logistics', desc: 'Cross-border fulfillment unlocked by L3 Operational Excellence.' },
  { icon: <HandshakeOutlinedIcon fontSize="small" />, name: 'GoInvestors', desc: 'Institutional deal-room access reserved for L4 Global enterprises.' },
  { icon: <SchoolOutlinedIcon fontSize="small" />, name: 'ADMIT Consulting', desc: 'Expert consulting and Master SOP drafting for your operational foundation.' },
];

export default function OverviewPage() {
  return (
    <Box className="flex flex-col gap-6">
      {/* Compact functional header — replaces the marketing-style hero now
          that this page is a real dashboard, not a landing moment. */}
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'primary.main' }}>
          Your Trust Journey
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mt: 0.5 }}>
          Comply. Scale. Lead.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 480 }}>
          Build a resilient, audit-ready foundation. Automate operations. Become a legacy brand.
        </Typography>
      </Box>

      {/* 3 pillars — Comply (free, always unlocked), Scale (pro), Lead (enterprise) */}
      <motion.div variants={cardGridContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PILLARS.map((pillar) => (
          <motion.div key={pillar.id} variants={cardGridItem}>
            <PillarCard pillar={pillar} icon={PILLAR_ICONS[pillar.id]} verifiedDocs={0} unlocked={pillar.tier === 'free'} />
          </motion.div>
        ))}
      </motion.div>

      <TrustBadgeJourney unlockedLevels={[]} overallPct={0} />

      {/* Current stage: L1 · The Launchpad, the only pathway on the free
          tier — reuses JourneyTree (scoped to just this one level) instead
          of re-implementing the milestone/document list by hand. */}
      <SectionCard title="L1 · The Launchpad — Bronze Foundation" subtitle="0/13 verified">
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
      <SectionCard>
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
      <SectionCard>
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

      {/* Ecosystem cross-sell, tied to specific badge unlocks */}
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          The ADMIT Global Ecosystem
        </Typography>
        <Box className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ECOSYSTEM.map((item) => (
            <Box
              key={item.name}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px',
                p: 1.75,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow:
                    '0 0 0 1px color-mix(in srgb, var(--mui-palette-primary-main) 15%, transparent), 0 8px 24px -8px color-mix(in srgb, var(--mui-palette-primary-main) 50%, transparent)',
                },
              }}
            >
              <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'action.selected', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                {item.icon}
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {item.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                {item.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
