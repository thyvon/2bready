'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import VerifiedIcon from '@mui/icons-material/Verified';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import Link from 'next/link';
import { SectionCard, EmptyState, GlowButton, ErrorState } from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';
import { TrustBadgeJourney } from '@/components/dashboard/TrustBadgeJourney';
import { useJourney } from '@/components/JourneyProvider';
import { usePackages } from '@/components/PackageProvider';
import { allDocuments, countVerified } from '@/lib/journey-api';
import { tierByLevelCode } from '@/lib/package-api';
import { formatDate } from '@/lib/utils';

export default function TrustBadgePage() {
  const { t } = useTranslation();
  const { journey, loading, trustBadges, trustBadgesError, refetchAll } = useJourney();
  const { packages } = usePackages();
  const levels = journey?.levels ?? [];
  const documents = allDocuments(journey);
  const totalDocs = documents.length;
  const verifiedDocs = countVerified(documents);
  const overallPct = totalDocs === 0 ? 0 : Math.round((verifiedDocs / totalDocs) * 100);
  const unlockedLevels = levels.filter((level) => level.unlocked).map((level) => level.code);
  const tierMap = useMemo(() => tierByLevelCode(packages), [packages]);

  const firstBadge = trustBadges[0];

  return (
    <Box className="flex flex-col gap-6">
      <Typography variant="body2" color="text.secondary">
        {t('trust_badge.intro')}
      </Typography>

      {loading ? (
        <SectionCard>
          <Box className="flex flex-col gap-3">
            <Box className="flex items-center gap-3">
              <Skeleton variant="circular" width={56} height={56} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="40%" height={16} />
              </Box>
            </Box>
          </Box>
        </SectionCard>
      ) : trustBadgesError ? (
        <ErrorState
          title={t('trust_badge.load_error')}
          action={<GlowButton size="small" onClick={() => void refetchAll()}>{t('common.retry')}</GlowButton>}
        />
      ) : trustBadges.length === 0 ? (
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
              <Typography variant="h6">{t('trust_badge.not_certified_title')}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mt: 0.5 }}>
                {t('trust_badge.not_certified_desc', {
                  verified: verifiedDocs,
                  total: totalDocs,
                  level: levels[0] ? `${levels[0].pathway_name} (${levels[0].code} · ${levels[0].name})` : 'Level 1',
                })}
              </Typography>
            </Box>
            <Box sx={{ width: '100%', maxWidth: 320, mt: 1 }}>
              <Box sx={{ height: 6, borderRadius: '4px', bgcolor: 'action.selected', overflow: 'hidden' }}>
                <Box sx={{ width: `${overallPct}%`, height: '100%', borderRadius: '4px', bgcolor: 'primary.main', transition: 'width 0.4s ease' }} />
              </Box>
            </Box>
            <Box sx={{ mt: 1 }}>
              <GlowButton href="/journey" size="medium">
                {t('trust_badge.continue_journey')}
              </GlowButton>
            </Box>
          </Box>
        </SectionCard>
      ) : (
        <Stack spacing={2}>
          {trustBadges.map((badge) => {
            const certificate = badge.certificate ?? null;
            return (
              <SectionCard key={badge.id}>
                <Box className="flex flex-col gap-3">
                  <Box className="flex items-center gap-3">
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        bgcolor: 'success.main',
                        color: 'success.contrastText',
                        flexShrink: 0,
                      }}
                    >
                      <VerifiedIcon sx={{ fontSize: '1.75rem' }} />
                    </Box>
                    <Box>
                      <Typography variant="h6">
                        {t('trust_badge.earned_title')} · {t('trust_badge.earned_level', { level: badge.level })}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('trust_badge.issued_on', { date: formatDate(badge.issued_at) })}
                      </Typography>
                    </Box>
                  </Box>

                  {certificate && (
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'action.hover',
                        border: '1px dashed',
                        borderColor: 'divider',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                        <QrCode2OutlinedIcon fontSize="small" />
                        <Typography variant="body2">
                          {t('trust_badge.verify_link')}:
                        </Typography>
                        <Typography
                          component={Link}
                          href={certificate.qr_payload_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="body2"
                          sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none', wordBreak: 'break-all', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {certificate.qr_payload_url}
                        </Typography>
                      </Box>
                      <Box sx={{ ml: 'auto' }}>
                        <Button
                          component="a"
                          href={certificate.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          variant="contained"
                          startIcon={<FileDownloadOutlinedIcon />}
                        >
                          {t('trust_badge.download_pdf')}
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              </SectionCard>
            );
          })}
        </Stack>
      )}

      <TrustBadgeJourney
        levels={levels}
        unlockedLevels={unlockedLevels}
        tierByLevelCode={tierMap}
        overallPct={overallPct}
      />

      <SectionCard title={t('trust_badge.public_verification_title')} subtitle={t('trust_badge.public_verification_subtitle')}>
        {loading ? (
          <Box className="flex flex-col items-center text-center gap-3" sx={{ py: 2 }}>
            <Skeleton variant="rounded" width="80%" height={16} />
            <Skeleton variant="rounded" width="60%" height={16} />
          </Box>
        ) : firstBadge?.certificate ? (
          <Box className="flex flex-col items-center text-center gap-3" sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
              <VerifiedIcon fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t('trust_badge.earned_title')} · {t('trust_badge.earned_level', { level: firstBadge.level })}
              </Typography>
            </Box>
            <Typography
              component={Link}
              href={firstBadge.certificate.qr_payload_url}
              target="_blank"
              rel="noopener noreferrer"
              variant="body2"
              sx={{ color: 'primary.main', textDecoration: 'none', wordBreak: 'break-all', '&:hover': { textDecoration: 'underline' } }}
            >
              {firstBadge.certificate.qr_payload_url}
            </Typography>
          </Box>
        ) : (
          <EmptyState
            icon={<QrCode2OutlinedIcon fontSize="inherit" />}
            title={t('trust_badge.no_verification_title')}
            description={t('trust_badge.no_verification_desc')}
          />
        )}
      </SectionCard>
    </Box>
  );
}
