'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import { motion } from 'framer-motion';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';

import SectionCard from '@/components/ui/SectionCard';
import CompanyEditDialog from '@/domains/company/components/CompanyEditDialog';
import { useIndustries } from '@/domains/company/hooks';
import { industryLabel, optionLabel, COUNTRY_OPTIONS } from '@/domains/company/constants';
import { formatDate, getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useCompanyWorkspace } from '@/domains/company/workspace-context';
import { getCompanyJourney } from '@/domains/journey/api';
import type { Journey } from '@/domains/journey/types';
import { JourneyHero } from '@/domains/journey/components/JourneyHero';
import { PillarCard } from '@/domains/journey/components/PillarCard';
import { PILLARS } from '@/domains/journey/pillars';
import { pillarLevels, allDocuments, countVerified } from '@/domains/journey/helpers';
import { cardGridContainer, cardGridItem } from '@/lib/motion';

const PILLAR_ICONS = {
  comply: <ShieldOutlinedIcon fontSize="small" />,
  scale: <TrendingUpOutlinedIcon fontSize="small" />,
  lead: <WorkspacePremiumOutlinedIcon fontSize="small" />,
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box className="flex items-center justify-between gap-4 py-2">
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
    </Box>
  );
}

export default function CompanyOverviewPage() {
  const params = useParams<{ id: string }>();
  const { company, reload } = useCompanyWorkspace();
  const { t, locale } = useTranslation();
  const { industries } = useIndustries();

  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const journeyData = await getCompanyJourney(params.id).catch((err) => {
          // No journey template for this company's country/industry yet is
          // an expected state (see the Journey tab's own handling of this),
          // not a load failure — the hero/pillars just don't render below.
          if (getApiError(err).message.includes('No journey found')) return null;
          throw err;
        });
        if (!cancelled) setJourney(journeyData);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const industry = industries.find((i) => i.id === company.industry_id);

  const documents = allDocuments(journey);
  const totalDocs = documents.length;
  const verifiedDocs = countVerified(documents);
  const overallPct = totalDocs === 0 ? 0 : Math.round((verifiedDocs / totalDocs) * 100);
  const pendingDocs = totalDocs - verifiedDocs;

  // Highest currently-unlocked level across every pillar (not scoped to one
  // pillar like client-portal's own Overview page) — an admin's reason for
  // being on this tab is often exactly to spot-check "does this company's
  // unlocked level match what they paid for," so the broadest real signal
  // is the useful one here, not the narrower "current stage" framing a
  // company owner needs. `journey.levels` is already returned in sort_order,
  // so the last unlocked entry is the highest one.
  const unlockedLevels = journey?.levels.filter((level) => level.unlocked) ?? [];
  const currentLevel = unlockedLevels.length > 0 ? unlockedLevels[unlockedLevels.length - 1].code : 'L1';

  if (loading) {
    return (
      <Box className="flex justify-center py-16">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="flex flex-col gap-6">
      {journey && (
        <>
          <JourneyHero overallPct={overallPct} currentLevel={currentLevel} pendingDocs={pendingDocs} />

          <motion.div variants={cardGridContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PILLARS.map((pillar) => {
              const levels = pillarLevels(journey, pillar.id);
              const docs = levels.flatMap((level) => level.milestones.flatMap((m) => m.documents));
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
        </>
      )}

      <SectionCard
        title={t('company.details')}
        action={
          <IconButton size="small" onClick={() => setEditOpen(true)} aria-label={t('common.edit')}>
            <EditIcon fontSize="small" />
          </IconButton>
        }
      >
        <DetailRow label={t('company.name')} value={company.name} />
        {company.name_kh && <DetailRow label={t('company.name_kh')} value={company.name_kh} />}
        <DetailRow label={t('company.registration_no')} value={company.registration_no ?? '—'} />
        <DetailRow label={t('company.industry')} value={industry ? industryLabel(industry, locale) : '—'} />
        <DetailRow label={t('company.country')} value={optionLabel(t, COUNTRY_OPTIONS, company.country_code)} />
        <DetailRow label={t('company.employee_count')} value={company.employee_count != null ? String(company.employee_count) : '—'} />
        <DetailRow label={t('company.compliance_score')} value={String(company.compliance_score)} />
        <DetailRow label={t('company.registered_on')} value={company.created_at ? formatDate(company.created_at) : '—'} />
      </SectionCard>

      <CompanyEditDialog
        open={editOpen}
        company={company}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          reload();
        }}
      />
    </Box>
  );
}
