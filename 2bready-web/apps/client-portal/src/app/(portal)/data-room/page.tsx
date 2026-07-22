'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import { Breadcrumbs, SectionCard, GlowButton, ConfirmDialog, CopySecretField } from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';
import { useNavItems } from '@/components/layout/nav-items';
import { useJourney } from '@/components/JourneyProvider';
import { PageLoader } from '@/components/PageLoader';
import { levelTotalDocs, levelVerifiedDocs } from '@/lib/journey-api';
import { listMySubscriptions } from '@/lib/subscription-api';
import {
  getMyDataRoomLink,
  createDataRoomLink,
  revokeDataRoomLink,
  type DataRoomLink,
} from '@/lib/data-room-api';
import { useToast } from '@/components/ToastProvider';
import { getApiError } from '@2bready/api-client';

export default function DataRoomPage() {
  const { t } = useTranslation();
  const { all } = useNavItems();
  const item = all.find((i) => i.href === '/data-room');
  const { journey, loading: journeyLoading } = useJourney();
  const toast = useToast();

  const FEATURES = [
    { icon: <LinkOutlinedIcon fontSize="small" />, title: t('data_room.feature_one_link_title'), desc: t('data_room.feature_one_link_desc') },
    { icon: <AccessTimeOutlinedIcon fontSize="small" />, title: t('data_room.feature_expiry_title'), desc: t('data_room.feature_expiry_desc') },
    { icon: <ShieldOutlinedIcon fontSize="small" />, title: t('data_room.feature_password_title'), desc: t('data_room.feature_password_desc') },
    { icon: <FilterListOutlinedIcon fontSize="small" />, title: t('data_room.feature_filter_title'), desc: t('data_room.feature_filter_desc') },
  ];

  const l4 = journey?.levels.find((level) => level.code === 'L4') ?? null;
  const l4TotalDocs = l4 ? levelTotalDocs(l4) : 0;
  const l4VerifiedDocs = l4 ? levelVerifiedDocs(l4) : 0;
  const l4Milestones = l4?.milestones.length ?? 0;
  const l4Complete = l4TotalDocs > 0 && l4VerifiedDocs === l4TotalDocs;

  const [subLoading, setSubLoading] = useState(true);
  const [hasEnterprisePlan, setHasEnterprisePlan] = useState(false);

  const [link, setLink] = useState<DataRoomLink | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [revealedPin, setRevealedPin] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [pendingRegenerate, setPendingRegenerate] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState(false);

  const unlocked = hasEnterprisePlan && l4Complete;

  useEffect(() => {
    let cancelled = false;

    async function loadSubscription() {
      setSubLoading(true);
      try {
        const subs = await listMySubscriptions();
        const active = subs.some((s) => s.status === 'active' && s.package?.tier === 'enterprise');
        if (!cancelled) setHasEnterprisePlan(active);
      } finally {
        if (!cancelled) setSubLoading(false);
      }
    }

    loadSubscription();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    let cancelled = false;

    async function loadLink() {
      setLinkLoading(true);
      try {
        const current = await getMyDataRoomLink();
        if (!cancelled) setLink(current);
      } finally {
        if (!cancelled) setLinkLoading(false);
      }
    }

    loadLink();
    return () => {
      cancelled = true;
    };
  }, [unlocked]);

  const doGenerate = async () => {
    setGenerating(true);
    try {
      const created = await createDataRoomLink();
      setLink(created);
      setRevealedPin(created.pin);
      toast.success(t('data_room.toast_generated'));
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setGenerating(false);
      setPendingRegenerate(false);
    }
  };

  const doRevoke = async () => {
    setRevoking(true);
    try {
      const revoked = await revokeDataRoomLink();
      setLink(revoked);
      setRevealedPin(null);
      toast.success(t('data_room.toast_revoked'));
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setRevoking(false);
      setPendingRevoke(false);
    }
  };

  if (journeyLoading || subLoading) return <PageLoader />;

  const breadcrumb = (
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
      items={[{ label: t('nav.overview'), href: '/' }, { label: item?.label ?? 'Data Room' }]}
    />
  );

  if (!unlocked) {
    return (
      <Box className="flex flex-col gap-6">
        {breadcrumb}

        <Typography variant="body2" color="text.secondary">
          {t('data_room.desc_locked')}
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
              <LockOutlinedIcon sx={{ fontSize: '2.25rem' }} />
            </Box>
            <Box>
              <Typography variant="h6">{t('data_room.locked_title')}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mt: 0.5 }}>
                {t('data_room.locked_desc', {
                  level: l4?.name ?? 'Platinum',
                  total: l4TotalDocs,
                  milestones: l4Milestones,
                  verified: l4VerifiedDocs,
                })}
              </Typography>
            </Box>
            <Box sx={{ mt: 1 }}>
              <GlowButton href="/billing" size="medium">
                {t('data_room.upgrade_cta')}
              </GlowButton>
            </Box>
          </Box>
        </SectionCard>

        <SectionCard title={t('data_room.features_title')} subtitle={t('data_room.features_subtitle')}>
          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <Box key={f.title} className="flex items-start gap-3" sx={{ opacity: 0.7 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'action.selected', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary', flexShrink: 0 }}>
                  {f.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {f.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {f.desc}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </SectionCard>
      </Box>
    );
  }

  const isActive = link?.status === 'active';
  const statusLabel = link
    ? { active: t('data_room.status_active'), expired: t('data_room.status_expired'), revoked: t('data_room.status_revoked') }[link.status]
    : '';

  return (
    <Box className="flex flex-col gap-6">
      {breadcrumb}

      <Typography variant="body2" color="text.secondary">
        {t('data_room.desc_unlocked')}
      </Typography>

      <SectionCard
        title={t('data_room.link_card_title')}
        action={
          link && (
            <Chip label={statusLabel} color={link.status === 'active' ? 'success' : 'default'} size="small" variant="outlined" />
          )
        }
      >
        {linkLoading ? (
          <Box className="flex justify-center py-8">
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Box className="flex flex-col gap-4">
            {!link && (
              <Box className="flex flex-col items-center text-center gap-3" sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
                  {t('data_room.no_link_desc')}
                </Typography>
                <GlowButton onClick={doGenerate} size="medium" disabled={generating}>
                  {generating ? t('data_room.generating') : t('data_room.generate_button')}
                </GlowButton>
              </Box>
            )}

            {link && (
              <>
                <CopySecretField label={t('data_room.link_label')} value={link.url} />
                {revealedPin && <CopySecretField label={t('data_room.pin_label')} value={revealedPin} />}
                {link.expires_at && (
                  <Typography variant="caption" color="text.secondary">
                    {t('data_room.expires_label', { date: new Date(link.expires_at).toLocaleDateString() })}
                  </Typography>
                )}

                <Box className="flex gap-3">
                  <GlowButton
                    size="small"
                    // Confirmation only matters when regenerating would
                    // actually revoke a live link — an already
                    // expired/revoked link has nothing left to lose, so
                    // generating its replacement can happen immediately.
                    onClick={() => (isActive ? setPendingRegenerate(true) : doGenerate())}
                    disabled={generating}
                  >
                    {t('data_room.regenerate_button')}
                  </GlowButton>
                  {isActive && (
                    <Box
                      component="button"
                      onClick={() => setPendingRevoke(true)}
                      sx={{
                        border: '1px solid',
                        borderColor: 'error.main',
                        color: 'error.main',
                        bgcolor: 'transparent',
                        borderRadius: '8px',
                        px: 2,
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {t('data_room.revoke_button')}
                    </Box>
                  )}
                </Box>
              </>
            )}
          </Box>
        )}
      </SectionCard>

      <SectionCard title={t('data_room.shared_title')} subtitle={t('data_room.shared_subtitle')}>
        <Box className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <Box key={f.title} className="flex items-start gap-3">
              <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'action.selected', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary', flexShrink: 0 }}>
                {f.icon}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {f.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {f.desc}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </SectionCard>

      <ConfirmDialog
        open={pendingRegenerate}
        title={t('data_room.confirm_regenerate_title')}
        description={t('data_room.confirm_regenerate_desc')}
        confirmLabel={t('data_room.confirm_regenerate_action')}
        danger
        loading={generating}
        onCancel={() => setPendingRegenerate(false)}
        onConfirm={doGenerate}
      />

      <ConfirmDialog
        open={pendingRevoke}
        title={t('data_room.confirm_revoke_title')}
        description={t('data_room.confirm_revoke_desc')}
        confirmLabel={t('data_room.confirm_revoke_action')}
        danger
        loading={revoking}
        onCancel={() => setPendingRevoke(false)}
        onConfirm={doRevoke}
      />
    </Box>
  );
}
