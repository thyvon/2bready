'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import { SectionCard, GlowButton } from '@2bready/ui-core';
import { LevelCardsGrid } from '@/components/dashboard/LevelCardsGrid';
import { TrustJourneyHero } from '@/components/dashboard/TrustJourneyHero';
import { PageLoader } from '@/components/PageLoader';
import { useJourney } from '@/components/JourneyProvider';
import { allDocuments, countVerified, levelTotalDocs, levelVerifiedDocs, toDocStatus, type Journey } from '@/lib/journey-api';
import { listMySubscriptions } from '@/lib/subscription-api';
import { listTrustBadges } from '@/lib/trust-badge-api';
import type { LevelBadgeLink } from '@/components/dashboard/LevelCardsGrid';
import { useTranslation } from '@/lib/i18n';

// Score-row labels are explicit keys so the i18n dict typing stays exact.
type LevelScoreKey = 'journey.level_l1_score' | 'journey.level_l2_score' | 'journey.level_l3_score' | 'journey.level_l4_score';
const LEVEL_SCORE_KEYS: Record<string, LevelScoreKey> = {
  L1: 'journey.level_l1_score',
  L2: 'journey.level_l2_score',
  L3: 'journey.level_l3_score',
  L4: 'journey.level_l4_score',
};

// Same lift + glow hover the pillar grid's sibling cards used — applied to
// every remaining SectionCard here so hovering anything on Overview still
// feels like one consistent surface.
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
  const { t } = useTranslation();

  // Active subscriptions drive the "Active Plan" chips on the level cards.
  const [activeLevelCodes, setActiveLevelCodes] = useState<Set<string>>(new Set());
  const [badgesByLevel, setBadgesByLevel] = useState<Map<string, LevelBadgeLink>>(new Map());
  const [subsLoading, setSubsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    listMySubscriptions()
      .then((subs) => {
        if (cancelled) return;
        setActiveLevelCodes(
          new Set(
            subs
              .filter((s) => s.status === 'active' && s.package?.journey_level_code)
              .map((s) => s.package!.journey_level_code!),
          ),
        );
      })
      .catch(() => {
        // Billing data failing to load shouldn't blank the whole dashboard —
        // cards just render without "Active Plan" chips.
      })
      .finally(() => {
        if (!cancelled) setSubsLoading(false);
      });

    // Earned badges power the Certificate/Report buttons on completed
    // level cards. Failure is non-fatal — cards render without them.
    listTrustBadges()
      .then((badges) => {
        if (cancelled) return;
        const map = new Map<string, LevelBadgeLink>();
        for (const badge of badges) {
          if (!map.has(badge.level)) {
            map.set(badge.level, {
              pdfUrl: badge.certificate?.pdf_url ?? null,
              verifyUrl: badge.qr_payload_url ?? null,
            });
          }
        }
        setBadgesByLevel(map);
      })
      .catch(() => {
        /* ignore — buttons just won't deep-link */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || subsLoading) return <PageLoader />;

  const documents = allDocuments(journey);
  const totalDocs = documents.length;
  const verifiedDocs = countVerified(documents);
  const overallPct = totalDocs === 0 ? 0 : Math.round((verifiedDocs / totalDocs) * 100);
  const pendingDocs = totalDocs - verifiedDocs;

  // Highest unlocked level across every pillar — with à-la-carte levels the
  // cap itself is the honest "trust level" signal for the hero tile.
  const unlockedLevels = journey?.levels.filter((level) => level.unlocked) ?? [];
  const currentLevel = unlockedLevels.length > 0 ? unlockedLevels[unlockedLevels.length - 1].code : '—';
  const nextDoc = nextPendingDocument(journey);

  return (
    <Box className="flex flex-col gap-6">
      <TrustJourneyHero overallPct={overallPct} currentLevel={currentLevel} pendingDocs={pendingDocs} />

      {journey && (
        <>
          <LevelCardsGrid journey={journey} activeLevelCodes={activeLevelCodes} badgesByLevel={badgesByLevel} />

          <SectionCard title={t('overview.readiness_scores')}>
            <Box className="flex flex-col gap-3">
              {journey.levels.map((level) => {
                const total = levelTotalDocs(level);
                const pct = total === 0 ? 0 : Math.round((levelVerifiedDocs(level) / total) * 100);
                return (
                  <Box key={level.id} className="flex items-center gap-3">
                    <Typography variant="body2" sx={{ width: 220, flexShrink: 0 }}>
                      {t(LEVEL_SCORE_KEYS[level.code] ?? 'journey.level_l1_score')}
                    </Typography>
                    <Box sx={{ flexGrow: 1, height: 8, borderRadius: 4, bgcolor: 'action.hover', overflow: 'hidden' }}>
                      <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 4, bgcolor: 'primary.main', transition: 'width 0.4s ease' }} />
                    </Box>
                    <Typography variant="body2" sx={{ width: 48, textAlign: 'right', fontWeight: 600 }}>{pct}%</Typography>
                  </Box>
                );
              })}
            </Box>
          </SectionCard>
        </>
      )}

      {/* Next best action — the single highest-priority document across ALL
          unlocked levels; disappears once nothing is pending. */}
      {nextDoc && (
        <SectionCard sx={cardHoverSx}>
          <Box className="flex items-center gap-4">
            <Box sx={{ width: 40, height: 40, borderRadius: '8px', bgcolor: 'text.primary', color: 'background.paper', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <DescriptionOutlinedIcon fontSize="small" />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {t('overview.next_upload_title', { name: nextDoc.docName })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('overview.next_upload_sub', { milestone: nextDoc.milestoneName, level: nextDoc.levelCode })}
              </Typography>
            </Box>
            <GlowButton href="/journey" size="medium">
              {t('overview.next_upload_cta')}
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
              {t('overview.nudge_title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('overview.nudge_desc')}
            </Typography>
          </Box>
          <GlowButton href="/support" size="medium">
            {t('overview.nudge_cta')}
          </GlowButton>
        </Box>
      </SectionCard>
    </Box>
  );
}

/** First unverified document in milestone order across unlocked levels only —
 *  locked levels' documents aren't actionable, so they must not surface. */
function nextPendingDocument(journey: Journey | null): { docName: string; milestoneName: string; levelCode: string } | null {
  if (!journey) return null;
  for (const level of journey.levels) {
    if (!level.unlocked) continue;
    for (const milestone of level.milestones) {
      for (const doc of milestone.documents) {
        if (toDocStatus(doc.status) !== 'verified') {
          return { docName: doc.name, milestoneName: milestone.name, levelCode: level.code };
        }
      }
    }
  }
  return null;
}
