'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import { SectionCard, GlowButton } from '@2bready/ui-core';
import { LevelCardsGrid } from '@/components/dashboard/LevelCardsGrid';
import { TrustJourneyHero } from '@/components/dashboard/TrustJourneyHero';
import { PackageDialog } from '@/components/dashboard/PackageDialog';
import { useJourney } from '@/components/JourneyProvider';
import { toDocStatus, levelTotalDocs, levelVerifiedDocs, type Journey } from '@/lib/journey-api';
import { fetchTrustBadgeReport, type TrustBadgeReport } from '@/lib/trust-badge-api';
import VerificationReportDialog from '@/components/dashboard/VerificationReportDialog';
import { DocumentPreviewDialog } from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';
import { getApiError } from '@/lib/utils';

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
  const { journey, loading, totalDocs, verifiedDocs, overallPct, activeLevelCodes, trustBadges, badgesByLevel } = useJourney();
  const { t } = useTranslation();

  const pendingDocs = totalDocs - verifiedDocs;

  // Highest unlocked level across every pillar — with à-la-carte levels the
  // cap itself is the honest "trust level" signal for the hero tile.
  const unlockedLevels = journey?.levels.filter((level) => level.unlocked) ?? [];
  const currentLevel = unlockedLevels.length > 0 ? unlockedLevels[unlockedLevels.length - 1].code : '—';
  const nextDoc = nextPendingDocument(journey);

  const [reportBadgeId, setReportBadgeId] = useState<string | null>(null);
  const [certPreview, setCertPreview] = useState<{ title: string; url: string } | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState<TrustBadgeReport | null>(null);
  const [reportError, setReportError] = useState('');
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [upgradeLevelCode, setUpgradeLevelCode] = useState<string | undefined>(undefined);

  const openCertificate = (levelCode: string) => {
    const badge = trustBadges.find((b) => b.level === levelCode);
    if (badge?.certificate?.pdf_url) {
      setCertPreview({ title: `${levelCode} — ${t('overview.certificate_btn')}`, url: badge.certificate.pdf_url });
    }
  };

  const openVerificationReport = (badgeId: string) => {
    setReportError('');
    setReportData(null);
    setReportLoading(true);
    setReportBadgeId(badgeId);
    fetchTrustBadgeReport(badgeId)
      .then(setReportData)
      .catch((err) => setReportError(getApiError(err).message))
      .finally(() => setReportLoading(false));
  };

  return (
    <Box className="flex flex-col gap-6">
      {/* Hero — skeleton circle + text lines when loading, real component when ready */}
      {loading ? (
        <Box
          sx={{
            borderRadius: '12px',
            border: '1px solid',
            borderColor: 'divider',
            p: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Skeleton variant="circular" width={64} height={64} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={180} height={24} />
            <Skeleton variant="text" width={260} height={14} sx={{ opacity: 0.6 }} />
          </Box>
          <Skeleton variant="text" width={80} height={20} />
        </Box>
      ) : (
        <TrustJourneyHero overallPct={overallPct} currentLevel={currentLevel} pendingDocs={pendingDocs} />
      )}

      {journey && (
        <>
          <LevelCardsGrid
            journey={journey}
            activeLevelCodes={activeLevelCodes}
            badgesByLevel={badgesByLevel}
            onOpenCertificate={openCertificate}
            onOpenReport={(level) => {
              const badgeId = trustBadges.find((b) => b.level === level)?.id;
              if (badgeId) openVerificationReport(badgeId);
            }}
            onUpgrade={(code) => { setUpgradeLevelCode(code); setPackageDialogOpen(true); }}
          />

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

      {/* Skeleton for API-dependent sections while loading */}
      {loading && (
        <>
          <SectionCard>
            <Box className="flex items-center gap-4">
              <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '8px', flexShrink: 0 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={18} />
                <Skeleton variant="text" width="80%" height={14} sx={{ opacity: 0.6 }} />
              </Box>
              <Skeleton variant="rounded" width={100} height={36} sx={{ borderRadius: '20px', flexShrink: 0 }} />
            </Box>
          </SectionCard>
          <SectionCard>
            <Box className="flex flex-col gap-3">
              {[0, 1, 2, 3].map((i) => (
                <Box key={i} className="flex items-center gap-3">
                  <Skeleton variant="text" width={140} height={14} />
                  <Skeleton variant="rounded" height={8} sx={{ flexGrow: 1, borderRadius: 4 }} />
                  <Skeleton variant="text" width={40} height={14} />
                </Box>
              ))}
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

      <VerificationReportDialog
        open={reportBadgeId !== null}
        onClose={() => setReportBadgeId(null)}
        report={reportData}
        loading={reportLoading}
        error={reportError}
      />

      <DocumentPreviewDialog
        open={certPreview !== null}
        onClose={() => setCertPreview(null)}
        title={certPreview?.title ?? ''}
        url={certPreview?.url ?? null}
        mimeType={certPreview ? 'application/pdf' : null}
      />

      <PackageDialog open={packageDialogOpen} onClose={() => setPackageDialogOpen(false)} levelCode={upgradeLevelCode} />
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
