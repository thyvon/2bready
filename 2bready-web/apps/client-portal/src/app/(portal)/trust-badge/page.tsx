'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import { Breadcrumbs, SectionCard, EmptyState, GlowButton } from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';
import { useNavItems } from '@/components/layout/nav-items';
import { TrustBadgeJourney } from '@/components/dashboard/TrustBadgeJourney';
import { BADGE_LEVELS, levelDocCount } from '@/lib/journey-data';

// No verification tracking exists yet (Sprint 4/5 backend work), so nobody
// has actually earned a badge — the hero and verification link stay honest
// empty states rather than showing a fake "Bronze" the moment L1 exists.
const TOTAL_DOCS = BADGE_LEVELS.reduce((sum, level) => sum + levelDocCount(level), 0);

export default function TrustBadgePage() {
  const { t } = useTranslation();
  const { all } = useNavItems();
  const item = all.find((i) => i.href === '/trust-badge');

  return (
    <Box className="flex flex-col gap-6">
      <Breadcrumbs
        icon={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '8px',
              bgcolor: 'text.primary',
              color: 'background.paper',
              flexShrink: 0,
            }}
          >
            {item?.icon}
          </Box>
        }
        items={[{ label: t('nav.overview'), href: '/' }, { label: item?.label ?? 'Trust Badge' }]}
      />

      <Typography variant="body2" color="text.secondary">
        Your Trust Badge is the credential auditors, partners, and lenders see — a public, verifiable record of how
        far your compliance journey has come. Earn it by completing a level&apos;s full document checklist.
      </Typography>

      <SectionCard>
        <Box className="flex flex-col items-center text-center gap-3" sx={{ py: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              borderRadius: '50%',
              border: '2px solid',
              borderColor: 'divider',
              color: 'text.disabled',
            }}
          >
            <VerifiedOutlinedIcon sx={{ fontSize: '2.25rem' }} />
          </Box>
          <Box>
            <Typography variant="h6">Not certified yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mt: 0.5 }}>
              0 of {TOTAL_DOCS} documents verified. Complete The Launchpad (L1 · Bronze) to earn your first badge.
            </Typography>
          </Box>
          <Box sx={{ width: '100%', maxWidth: 320, mt: 1 }}>
            <Box sx={{ height: 6, borderRadius: '4px', bgcolor: 'action.selected', overflow: 'hidden' }}>
              <Box sx={{ width: '0%', height: '100%', borderRadius: '4px', bgcolor: 'primary.main' }} />
            </Box>
          </Box>
          <Box sx={{ mt: 1 }}>
            <GlowButton href="/journey" size="medium">
              Continue Your Journey →
            </GlowButton>
          </Box>
        </Box>
      </SectionCard>

      <TrustBadgeJourney unlockedLevels={[]} overallPct={0} />

      <SectionCard title="Public Verification" subtitle="Share your certified status with anyone, without exposing your documents">
        <EmptyState
          icon={<QrCode2OutlinedIcon fontSize="inherit" />}
          title="No verification link yet"
          description="Once you earn a badge, a public status page and QR code will appear here for auditors and partners to confirm your certification — no login required, no documents exposed."
        />
      </SectionCard>
    </Box>
  );
}
