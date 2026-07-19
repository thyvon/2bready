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
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import TranslateOutlinedIcon from '@mui/icons-material/TranslateOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';

import SectionCard from '@/components/ui/SectionCard';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import UserAvatar from '@/components/ui/UserAvatar';
import CompanyEditDialog from '@/domains/company/components/CompanyEditDialog';
import { useIndustries } from '@/domains/company/hooks';
import { listCompanyUsers } from '@/domains/company/api';
import { industryLabel, optionLabel, companyRoleOf, COUNTRY_OPTIONS } from '@/domains/company/constants';
import type { User } from '@/domains/user/types';
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

function DetailField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Box className="flex items-start gap-3">
      <Box sx={{ color: 'text.secondary', mt: '2px' }}>{icon}</Box>
      <Box className="min-w-0">
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
      </Box>
    </Box>
  );
}

export default function CompanyOverviewPage() {
  const params = useParams<{ id: string }>();
  const { company, reload } = useCompanyWorkspace();
  const { t, locale } = useTranslation();
  const { industries } = useIndustries();

  const [journey, setJourney] = useState<Journey | null>(null);
  const [owners, setOwners] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [journeyData, users] = await Promise.all([
          getCompanyJourney(params.id).catch((err) => {
            // No journey template for this company's country/industry yet is
            // an expected state (see the Journey tab's own handling of this),
            // not a load failure — the hero/pillars just don't render below.
            if (getApiError(err).message.includes('No journey found')) return null;
            throw err;
          }),
          listCompanyUsers(params.id),
        ]);
        if (!cancelled) {
          setJourney(journeyData);
          setOwners(users.filter((u) => companyRoleOf(u) === 'company_owner'));
        }
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

      <Box className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard
          title={t('company.details')}
          className="lg:col-span-2"
          action={
            <IconButton size="small" onClick={() => setEditOpen(true)} aria-label={t('common.edit')}>
              <EditIcon fontSize="small" />
            </IconButton>
          }
        >
          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <DetailField icon={<BusinessOutlinedIcon fontSize="small" />} label={t('company.name')} value={company.name} />
            {company.name_kh && (
              <DetailField icon={<TranslateOutlinedIcon fontSize="small" />} label={t('company.name_kh')} value={company.name_kh} />
            )}
            <DetailField icon={<BadgeOutlinedIcon fontSize="small" />} label={t('company.registration_no')} value={company.registration_no ?? '—'} />
            <DetailField
              icon={<CategoryOutlinedIcon fontSize="small" />}
              label={t('company.industry')}
              value={industry ? industryLabel(industry, locale) : '—'}
            />
            <DetailField
              icon={<PublicOutlinedIcon fontSize="small" />}
              label={t('company.country')}
              value={optionLabel(t, COUNTRY_OPTIONS, company.country_code)}
            />
            <DetailField
              icon={<GroupsOutlinedIcon fontSize="small" />}
              label={t('company.employee_count')}
              value={company.employee_count != null ? String(company.employee_count) : '—'}
            />
            <DetailField icon={<VerifiedOutlinedIcon fontSize="small" />} label={t('company.compliance_score')} value={String(company.compliance_score)} />
            <DetailField
              icon={<CalendarTodayOutlinedIcon fontSize="small" />}
              label={t('company.registered_on')}
              value={company.created_at ? formatDate(company.created_at) : '—'}
            />
          </Box>
        </SectionCard>

        <SectionCard title={t('company.owner_title')} className="lg:col-span-1">
          {owners.length === 0 ? (
            <EmptyState
              title={t('company.no_owner')}
              description={t('company.no_owner_desc')}
              icon={<PersonOutlineOutlinedIcon fontSize="inherit" />}
            />
          ) : (
            <Box className="flex flex-col gap-4">
              {owners.map((owner, i) => (
                <Box
                  key={owner.id}
                  className="flex items-start gap-3"
                  sx={i > 0 ? { pt: 2, borderTop: '1px solid', borderColor: 'divider' } : undefined}
                >
                  <UserAvatar name={owner.name} size={40} />
                  <Box className="min-w-0 flex-1">
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{owner.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>{owner.email}</Typography>
                    <Box className="flex items-center gap-2" sx={{ mt: 0.75 }}>
                      <StatusBadge status={owner.status ?? 'active'} />
                      {owner.created_at && (
                        <Typography variant="caption" color="text.secondary">
                          {t('company.owner_joined', { date: formatDate(owner.created_at) })}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </SectionCard>
      </Box>

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
