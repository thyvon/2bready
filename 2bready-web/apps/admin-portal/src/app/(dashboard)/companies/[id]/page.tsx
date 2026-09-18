'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import AddIcon from '@mui/icons-material/Add';
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
import DetailField from '@/components/ui/DetailField';
import PageSkeleton from '@/components/ui/PageSkeleton';
import UserAvatar from '@/components/ui/UserAvatar';
import { useToast } from '@/components/feedback/ToastProvider';
import CompanyEditDialog from '@/domains/company/components/CompanyEditDialog';
import CompanyUserEditDialog from '@/domains/company/components/CompanyUserEditDialog';
import AddCompanyUserDialog from '@/domains/company/components/AddCompanyUserDialog';
import AssignCompanyUserDialog from '@/domains/company/components/AssignCompanyUserDialog';
import { useIndustries } from '@/domains/company/hooks';
import { listCompanyUsers, listCompanySubscriptions, deleteCompany, removeCompanyUser } from '@/domains/company/api';
import { ConfirmDialog } from '@2bready/ui-core';
import { industryLabel, optionLabel, companyRoleOf, COUNTRY_OPTIONS } from '@/domains/company/constants';
import type { User } from '@/domains/user/types';
import { formatDate, getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useCompanyWorkspace } from '@/domains/company/workspace-context';
import { getCompanyJourney } from '@/domains/journey/api';
import type { Journey, JourneyLevel } from '@/domains/journey/types';
import { JourneyHero } from '@/domains/journey/components/JourneyHero';
import { LevelCardsGrid } from '@/domains/journey/components/LevelCardsGrid';
import { allDocuments, countVerified } from '@/domains/journey/helpers';
import { flattenDocuments } from '@/domains/journey/types';
import { useRouter } from 'next/navigation';

// Same per-level emoji as the grid cards; score labels are explicit keys so
// the i18n dict typing stays exact (no template-literal keys).
const LEVEL_SCORE_KEYS: Record<string, 'journey.level_l1_score' | 'journey.level_l2_score' | 'journey.level_l3_score' | 'journey.level_l4_score'> = {
  L1: 'journey.level_l1_score',
  L2: 'journey.level_l2_score',
  L3: 'journey.level_l3_score',
  L4: 'journey.level_l4_score',
};

export default function CompanyOverviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { company, setCompany } = useCompanyWorkspace();
  const { t, locale } = useTranslation();
  const { industries } = useIndustries();
  const toast = useToast();

  const [journey, setJourney] = useState<Journey | null>(null);
  // All company users — rendered in the team card, owners first.
  const [members, setMembers] = useState<User[]>([]);
  const [activeLevelCodes, setActiveLevelCodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Team-card inline edit — opens the shared CompanyUserEditDialog.
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [removingMember, setRemovingMember] = useState<User | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [journeyData, users, subscriptions] = await Promise.all([
          getCompanyJourney(params.id).catch((err) => {
            // No journey template for this company's country/industry yet is
            // an expected state (see the Journey tab's own handling of this),
            // not a load failure — the hero/pillars just don't render below.
            if (getApiError(err).message.includes('No journey found')) return null;
            throw err;
          }),
          listCompanyUsers(params.id),
          listCompanySubscriptions(params.id),
        ]);
        if (!cancelled) {
          setJourney(journeyData);
          setMembers(users);
          setActiveLevelCodes(
            new Set(
              subscriptions
                .filter((s) => s.status === 'active' && s.package?.journey_level_code)
                .map((s) => s.package!.journey_level_code!),
            ),
          );
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

  // Owners on top, then members — alphabetical within each group.
  const sortedMembers = useMemo(
    () =>
      [...members].sort((a, b) => {
        const aOwner = companyRoleOf(a) === 'company_owner' ? 0 : 1;
        const bOwner = companyRoleOf(b) === 'company_owner' ? 0 : 1;
        return aOwner - bOwner || a.name.localeCompare(b.name);
      }),
    [members],
  );

  const documents = allDocuments(journey);
  const totalDocs = documents.length;
  const verifiedDocs = countVerified(documents);
  const overallPct = totalDocs === 0 ? 0 : Math.round((verifiedDocs / totalDocs) * 100);
  const pendingDocs = totalDocs - verifiedDocs;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCompany(params.id);
      router.push('/companies');
    } catch {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

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
    return <PageSkeleton sections={2} fieldsPerSection={5} />;
  }

  return (
    <Box className="flex flex-col gap-6">
      {journey && (
        <>
          <JourneyHero overallPct={overallPct} currentLevel={currentLevel} pendingDocs={pendingDocs} />

          <LevelCardsGrid journey={journey} activeLevelCodes={activeLevelCodes} />

          <SectionCard title={t('overview.readiness_scores')}>
            <Box className="flex flex-col gap-3">
              {journey.levels.map((level: JourneyLevel) => {
                const docs = flattenDocuments(level.milestones.flatMap((m) => m.documents));
                const pct = docs.length === 0 ? 0 : Math.round((countVerified(docs) / docs.length) * 100);
                return (
                  <Box key={level.id} className="flex items-center gap-3">
                    <Typography variant="body2" sx={{ width: 220, flexShrink: 0 }}>
                      {t(LEVEL_SCORE_KEYS[level.code] ?? 'company.compliance_score')}
                    </Typography>
                    <Box sx={{ flexGrow: 1, height: 8, borderRadius: 4, bgcolor: 'action.hover', overflow: 'hidden' }}>
                      <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 4, bgcolor: 'primary.main' }} />
                    </Box>
                    <Typography variant="body2" sx={{ width: 48, textAlign: 'right', fontWeight: 600 }}>{pct}%</Typography>
                  </Box>
                );
              })}
            </Box>
          </SectionCard>
        </>
      )}

      <Box className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard
          title={t('company.details')}
          className="lg:col-span-2"
          action={
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton size="small" onClick={() => setEditOpen(true)} aria-label={t('common.edit')}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setDeleteOpen(true)} aria-label={t('common.delete')} sx={{ color: 'error.main' }}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
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

        <SectionCard
          title={t('company.team_title')}
          className="lg:col-span-1"
          action={
            <Box className="flex gap-1">
              <IconButton size="small" aria-label={t('company_users.assign_user')} onClick={() => setAssignOpen(true)}>
                <PersonOutlineOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" aria-label={t('company_users.add_user')} onClick={() => setAddOpen(true)}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          }
        >
          {members.length === 0 ? (
            <EmptyState
              title={t('company.no_owner')}
              description={t('company.no_owner_desc')}
              icon={<PersonOutlineOutlinedIcon fontSize="inherit" />}
            />
          ) : (
            <Box className="flex flex-col gap-4">
              {sortedMembers.map((member, i) => {
                const isOwner = companyRoleOf(member) === 'company_owner';
                return (
                  <Box
                    key={member.id}
                    className="flex items-start gap-3"
                    sx={i > 0 ? { pt: 2, borderTop: '1px solid', borderColor: 'divider' } : undefined}
                  >
                    <UserAvatar name={member.name} size={40} />
                    <Box className="min-w-0 flex-1">
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{member.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>{member.email}</Typography>
                      <Box className="flex items-center gap-2" sx={{ mt: 0.75 }}>
                        <Chip
                          size="small"
                          color={isOwner ? 'primary' : 'default'}
                          variant="outlined"
                          label={t(isOwner ? 'company_users.role_company_owner' : 'company_users.role_company_member')}
                        />
                        <StatusBadge status={member.status ?? 'active'} />
                        {member.created_at && (
                          <Typography variant="caption" color="text.secondary">
                            {t('company.owner_joined', { date: formatDate(member.created_at) })}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Box className="flex gap-0.5">
                      <IconButton size="small" aria-label={t('common.edit')} onClick={() => setEditingMember(member)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" aria-label={t('common.delete')} onClick={() => setRemovingMember(member)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </SectionCard>
      </Box>

      {/* Member edit — the same shared dialog the Users tab uses
          (CompanyUserEditDialog), surfaced inline so fixing a role doesn't
          require leaving the Overview tab. */}
      <CompanyUserEditDialog
        companyId={company.id}
        user={editingMember}
        onClose={() => setEditingMember(null)}
        onSaved={(updated) => {
          setEditingMember(null);
          setMembers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        }}
      />

      <AddCompanyUserDialog
        companyId={company.id}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={(user) => setMembers((prev) => [...prev, user])}
      />

      <AssignCompanyUserDialog
        companyId={company.id}
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onSaved={(user) => setMembers((prev) => [...prev, user])}
      />

      <ConfirmDialog
        open={!!removingMember}
        title={t('company_users.remove_user')}
        description={t('company_users.remove_user_confirm', { name: removingMember?.name ?? '' })}
        confirmLabel={t('common.delete')}
        danger
        loading={removing}
        onCancel={() => setRemovingMember(null)}
        onConfirm={async () => {
          if (!removingMember) return;
          setRemoving(true);
          try {
            await removeCompanyUser(company.id, removingMember.id);
            setMembers((prev) => prev.filter((u) => u.id !== removingMember.id));
            toast.success(t('company_users.remove_success'));
          } catch (err) {
            toast.error(getApiError(err).message);
          } finally {
            setRemoving(false);
            setRemovingMember(null);
          }
        }}
      />

      <CompanyEditDialog
        open={editOpen}
        company={company}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => {
          setEditOpen(false);
          setCompany(updated);
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t('admin.delete_company')}
        description={t('admin.delete_company_confirm', { name: company.name })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
