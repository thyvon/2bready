'use client';

import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Rating from '@mui/material/Rating';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { Breadcrumbs, EmptyState, PillToggle, ConfirmDialog, SectionCard, cardRestShadow, cardHoverGlow } from '@2bready/ui-core';
import { getApiError, formatCents } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useNavItems } from '@/components/layout/nav-items';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageLoader } from '@/components/PageLoader';
import { useToast } from '@/components/ToastProvider';
import { useJourney } from '@/components/JourneyProvider';
import { listActiveTpPartners, listMyTpHires, hireTpPartner, cancelTpHire, rateTpHire, type TpPartner, type TpHire } from '@/lib/marketplace-api';

const LEVELS = ['L2', 'L3', 'L4'] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_PRICE_FIELD: Record<Level, keyof TpPartner> = {
  L2: 'price_l2_cents',
  L3: 'price_l3_cents',
  L4: 'price_l4_cents',
};

const MARK_COLORS = [
  { background: 'rgba(0,112,243,0.10)', color: 'primary.main' },
  { background: 'rgba(124,58,237,0.10)', color: 'secondary.main' },
  { background: 'rgba(22,163,74,0.10)', color: 'success.main' },
  { background: 'rgba(245,166,35,0.12)', color: 'warning.main' },
];

interface HireDraft {
  partner: TpPartner;
  level: Level;
  priceCents: number;
}

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/);
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase();
}

function priceFor(partner: TpPartner, level: Level): number | null {
  return (partner[LEVEL_PRICE_FIELD[level]] as number | null | undefined) ?? null;
}

function pricedLevels(partner: TpPartner): Level[] {
  return LEVELS.filter((level) => priceFor(partner, level) !== null);
}

function lowestPrice(partner: TpPartner): number | null {
  const prices = pricedLevels(partner).map((level) => priceFor(partner, level)).filter((price): price is number => price !== null);
  return prices.length > 0 ? Math.min(...prices) : null;
}

export default function AuditsPage() {
  const { t } = useTranslation();
  const { all } = useNavItems();
  const item = all.find((i) => i.href === '/audits');
  const toast = useToast();
  const { journey, loading: journeyLoading } = useJourney();

  const [tpPartners, setTpPartners] = useState<TpPartner[]>([]);
  const [hires, setHires] = useState<TpHire[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiring, setHiring] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<'all' | Level>('all');
  const [hireFilter, setHireFilter] = useState<'all' | 'pending_payment' | 'active' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [hireDraft, setHireDraft] = useState<HireDraft | null>(null);
  const [cancelTarget, setCancelTarget] = useState<TpHire | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [rateTarget, setRateTarget] = useState<TpHire | null>(null);
  const [rateStars, setRateStars] = useState(0);
  const [rateReview, setRateReview] = useState('');
  const [submittingRate, setSubmittingRate] = useState(false);

  async function refreshAll() {
    const [partners, myHires] = await Promise.all([listActiveTpPartners(), listMyTpHires()]);
    setTpPartners(partners);
    setHires(myHires);
  }

  async function refreshHires() {
    setHires(await listMyTpHires());
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [partners, myHires] = await Promise.all([listActiveTpPartners(), listMyTpHires()]);
        if (!cancelled) {
          setTpPartners(partners);
          setHires(myHires);
        }
      } catch {
        // No firms/hires yet is a valid empty state, not an error.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeHires = hires.filter((h) => h.status !== 'cancelled');
  const unlockedLevelCodes = new Set((journey?.levels ?? []).filter((level) => level.unlocked).map((level) => level.code));

  const filteredPartners = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return tpPartners
      .filter((partner) => {
        const matchesSearch = normalized.length === 0 || partner.name.toLowerCase().includes(normalized);
        const matchesLevel = levelFilter === 'all' || priceFor(partner, levelFilter) !== null;
        const matchesHire =
          hireFilter === 'all' || hires.some((hire) => hire.tp_partner_id === partner.id && hire.status === hireFilter);
        return matchesSearch && matchesLevel && matchesHire;
      })
      .sort((a, b) => {
        const coverageDiff = pricedLevels(b).length - pricedLevels(a).length;
        if (coverageDiff !== 0) return coverageDiff;
        return (lowestPrice(a) ?? Number.MAX_SAFE_INTEGER) - (lowestPrice(b) ?? Number.MAX_SAFE_INTEGER);
      });
  }, [hireFilter, levelFilter, search, tpPartners, hires]);

  function pathwayName(level: Level): string {
    return journey?.levels.find((item) => item.code === level)?.pathway_name ?? level;
  }

  function isLevelUnlocked(level: Level): boolean {
    return unlockedLevelCodes.has(level);
  }

  // Partner-aware: a hire is bound to one firm, so a level row on firm A's
  // card must never show firm B's engagement for the same level.
  function hiredHireFor(partner: TpPartner, level: Level): TpHire | null {
    return activeHires.find((hire) => hire.tp_partner_id === partner.id && hire.journey_level === level) ?? null;
  }

  function requestHire(partner: TpPartner, level: Level) {
    if (!isLevelUnlocked(level)) return;
    const priceCents = priceFor(partner, level);
    if (priceCents === null) return;
    setHireDraft({ partner, level, priceCents });
  }

  async function confirmHire() {
    if (!hireDraft) return;

    const key = `${hireDraft.partner.id}:${hireDraft.level}`;
    setHiring(key);
    try {
      await hireTpPartner(hireDraft.partner.id, hireDraft.level);
      await refreshHires();
      toast.success(t('audits.hire_success'));
      setHireDraft(null);
    } catch (err) {
      toast.error(getApiError(err).message || t('audits.hire_error'));
    } finally {
      setHiring(null);
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelTpHire(cancelTarget.id);
      await refreshAll();
      toast.success(t('audits.cancel_hire_success'));
      setCancelTarget(null);
    } catch (err) {
      toast.error(getApiError(err).message || t('audits.cancel_hire_error'));
    } finally {
      setCancelling(false);
    }
  }

  function openRate(hire: TpHire) {
    setRateStars(0);
    setRateReview('');
    setRateTarget(hire);
  }

  async function submitRate() {
    if (!rateTarget || rateStars < 1) return;
    setSubmittingRate(true);
    try {
      await rateTpHire(rateTarget.id, rateStars, rateReview.trim() === '' ? null : rateReview.trim());
      await refreshAll();
      toast.success(t('audits.rate_success'));
      setRateTarget(null);
    } catch (err) {
      toast.error(getApiError(err).message || t('audits.rate_error'));
    } finally {
      setSubmittingRate(false);
    }
  }

  if (loading || journeyLoading) return <PageLoader />;

  return (
    <Box className="flex flex-col gap-7">
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
        items={[{ label: t('nav.overview'), href: '/' }, { label: item?.label ?? t('nav.audits') }]}
      />

      <Box component="section" className="flex flex-col gap-5">
        <PageHeader
          title={t('audits.marketplace_title')}
          subtitle={t('audits.marketplace_subtitle')}
          action={
            <TextField
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              size="small"
              placeholder={t('audits.search_placeholder')}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ minWidth: { xs: '100%', sm: 240 } }}
            />
          }
        />

        <SectionCard noPadding>
          <Box className="flex flex-wrap items-center gap-2 p-2.5">
            <PillToggle
              options={[
                { key: 'all', label: t('audits.filter_all_levels') },
                { key: 'L2', label: 'L2' },
                { key: 'L3', label: 'L3' },
                { key: 'L4', label: 'L4' },
              ]}
              value={levelFilter}
              onChange={setLevelFilter}
              layoutId="audits-level-pill"
            />
            <Divider orientation="vertical" flexItem sx={{ alignSelf: 'stretch' }} />
            <PillToggle
              options={[
                { key: 'all', label: t('audits.filter_all_hires') },
                { key: 'pending_payment', label: t('audits.status_pending_payment') },
                { key: 'active', label: t('audits.status_active') },
                { key: 'completed', label: t('audits.status_completed') },
              ]}
              value={hireFilter}
              onChange={setHireFilter}
              layoutId="audits-status-pill"
            />
          </Box>
        </SectionCard>

        {tpPartners.length === 0 ? (
          <EmptyState title={t('audits.marketplace_empty_title')} description={t('audits.marketplace_empty_desc')} />
        ) : filteredPartners.length === 0 ? (
          <EmptyState title={t('audits.no_results_title')} description={t('audits.no_results_desc')} />
        ) : (
          <Box className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
            {filteredPartners.map((partner, index) => (
              <PartnerCard
                key={partner.id}
                partner={partner}
                index={index}
                hiring={hiring}
                hiredHireFor={hiredHireFor}
                isLevelUnlocked={isLevelUnlocked}
                pathwayName={pathwayName}
                onHire={requestHire}
                onCancelHire={setCancelTarget}
                onRateHire={openRate}
              />
            ))}
          </Box>
        )}
      </Box>

      <ConfirmDialog
        open={hireDraft !== null}
        title={hireDraft ? t('audits.confirm_hire_title', { partner: hireDraft.partner.name }) : ''}
        description={
          hireDraft
            ? t('audits.hire_confirm', {
                partner: hireDraft.partner.name,
                level: hireDraft.level,
                price: formatCents(hireDraft.priceCents, 'USD'),
              })
            : ''
        }
        confirmLabel={t('audits.confirm_hire_action')}
        cancelLabel={t('audits.confirm_hire_cancel')}
        loading={hireDraft ? hiring === `${hireDraft.partner.id}:${hireDraft.level}` : false}
        onCancel={() => setHireDraft(null)}
        onConfirm={confirmHire}
      />

      <ConfirmDialog
        open={cancelTarget !== null}
        title={t('audits.cancel_hire_title')}
        description={cancelTarget ? t('audits.cancel_hire_confirm', { partner: cancelTarget.tp_partner?.name ?? t('audits.unknown_partner') }) : ''}
        confirmLabel={t('audits.cancel_hire_action')}
        cancelLabel={t('audits.confirm_hire_cancel')}
        danger
        loading={cancelling}
        onCancel={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
      />

      <RatingDialog
        open={rateTarget !== null}
        partnerName={rateTarget?.tp_partner?.name ?? t('audits.unknown_partner')}
        stars={rateStars}
        review={rateReview}
        submitting={submittingRate}
        onStarsChange={setRateStars}
        onReviewChange={setRateReview}
        onSubmit={submitRate}
        onClose={() => setRateTarget(null)}
      />
    </Box>
  );
}

function FirmMark({ name, index }: { name: string; index: number }) {
  const mark = MARK_COLORS[index % MARK_COLORS.length];

  return (
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        flexShrink: 0,
        bgcolor: mark.background,
        color: mark.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        fontSize: '0.8125rem',
      }}
    >
      {initialsFor(name)}
    </Box>
  );
}

function RatingLine({ partner }: { partner: TpPartner }) {
  const { t } = useTranslation();

  if (partner.rating_avg !== undefined && partner.rating_avg !== null) {
    return (
      <Box className="flex items-center gap-0.5" sx={{ color: 'warning.main' }}>
        <StarRoundedIcon sx={{ fontSize: 15 }} />
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          {partner.rating_avg.toFixed(1)} ·{' '}
          {partner.rating_count === 1 ? t('audits.review_count_one') : t('audits.review_count_many', { count: partner.rating_count ?? 0 })}
        </Typography>
      </Box>
    );
  }

  return (
    <Typography variant="caption" color="text.secondary">
      {t('audits.no_reviews_yet')}
    </Typography>
  );
}

interface PartnerCardProps {
  partner: TpPartner;
  index: number;
  hiring: string | null;
  hiredHireFor: (partner: TpPartner, level: Level) => TpHire | null;
  isLevelUnlocked: (level: Level) => boolean;
  pathwayName: (level: Level) => string;
  onHire: (partner: TpPartner, level: Level) => void;
  onCancelHire: (hire: TpHire) => void;
  onRateHire: (hire: TpHire) => void;
}

function PartnerCard({ partner, index, hiring, hiredHireFor, isLevelUnlocked, pathwayName, onHire, onCancelHire, onRateHire }: PartnerCardProps) {
  const { t } = useTranslation();
  const startsAt = lowestPrice(partner);

  return (
    <Box
      sx={{
        borderRadius: '8px',
        boxShadow: cardRestShadow,
        bgcolor: 'background.paper',
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 2.25,
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        '&:hover': { boxShadow: cardHoverGlow(), transform: 'translateY(-2px)' },
      }}
    >
      <Box className="flex items-start justify-between gap-3">
        <Box className="flex items-center gap-2.5" sx={{ minWidth: 0 }}>
          <FirmMark name={partner.name} index={index} />
          <Box sx={{ minWidth: 0 }}>
            <Box className="flex items-center gap-1" sx={{ minWidth: 0 }}>
              <Typography variant="h4" sx={{ fontWeight: 800 }} noWrap>
                {partner.name}
              </Typography>
              <Chip size="small" icon={<VerifiedUserOutlinedIcon />} label={t('audits.verified_partner')} sx={{ borderRadius: '9999px', height: 20, '& .MuiChip-label': { px: 0.75, fontSize: '0.625rem' } }} />
            </Box>
            {partner.name_kh && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 240 }}>
                {partner.name_kh}
              </Typography>
            )}
            <Box sx={{ mt: 0.5 }}>
              <RatingLine partner={partner} />
            </Box>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          <Typography variant="caption" color="text.secondary">
            {t('audits.starts_at')}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
            {startsAt !== null ? formatCents(startsAt, 'USD') : t('audits.stat_empty')}
          </Typography>
        </Box>
      </Box>

      <Divider />

      <Box className="flex flex-col gap-1">
        {LEVELS.map((level) => {
          const priceCents = priceFor(partner, level);
          const hasPrice = priceCents !== null;
          const hire = hiredHireFor(partner, level);
          const unlocked = isLevelUnlocked(level);
          const key = `${partner.id}:${level}`;

          return (
            <Box
              key={level}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) auto' },
                alignItems: 'center',
                gap: 1.5,
                borderRadius: '8px',
                px: 1.25,
                py: 1,
                opacity: unlocked ? 1 : 0.6,
                transition: 'opacity 0.2s ease, background-color 0.15s ease',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Box className="flex items-center gap-2" sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '7px',
                    bgcolor: unlocked && hasPrice ? 'action.selected' : 'transparent',
                    border: unlocked && hasPrice ? '1px solid transparent' : '1px solid',
                    borderColor: unlocked && hasPrice ? 'transparent' : 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '0.6875rem',
                    color: unlocked && hasPrice ? 'text.primary' : 'text.disabled',
                    flexShrink: 0,
                  }}
                >
                  {level}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: hasPrice ? 'text.primary' : 'text.disabled' }} noWrap>
                    {pathwayName(level)}
                  </Typography>
                  <Typography variant="caption" color={hasPrice ? 'text.secondary' : 'text.disabled'}>
                    {hasPrice ? t('audits.audit_review_package') : t('audits.no_price_available')}
                  </Typography>
                </Box>
              </Box>

              <Box className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: hasPrice ? 'text.primary' : 'text.disabled' }}>
                  {hasPrice ? formatCents(priceCents, 'USD') : t('audits.stat_empty')}
                </Typography>

                {!hasPrice ? null : !unlocked ? (
                  <Tooltip title={t('audits.locked_tooltip', { level })}>
                    <span>
                      <Button variant="outlined" size="small" disabled startIcon={<LockOutlinedIcon fontSize="small" />} sx={{ minWidth: 132 }}>
                        {t('audits.locked_label')}
                      </Button>
                    </span>
                  </Tooltip>
                ) : hire === null ? (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<HandshakeOutlinedIcon />}
                    loading={hiring === key}
                    onClick={() => onHire(partner, level)}
                    sx={{ minWidth: 132 }}
                  >
                    {t('audits.hire_button', { level })}
                  </Button>
                ) : (
                  <>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      {hire.status === 'pending_payment'
                        ? t('audits.status_pending_payment')
                        : hire.status === 'active'
                          ? t('audits.status_active')
                          : t('audits.status_completed')}
                    </Typography>
                    {hire.status === 'pending_payment' && (
                      <Button href="/billing" size="small" variant="contained">
                        {t('audits.pay_button')}
                      </Button>
                    )}
                    {hire.status === 'pending_payment' && (
                      <Button size="small" variant="outlined" color="error" onClick={() => onCancelHire(hire)}>
                        {t('audits.cancel_hire_action')}
                      </Button>
                    )}
                    {hire.status === 'completed' && hire.rating && (
                      <Box className="flex items-center gap-0.5" sx={{ color: 'warning.main' }}>
                        <StarRoundedIcon sx={{ fontSize: 15 }} />
                        <Typography variant="caption" sx={{ fontWeight: 800 }}>
                          {hire.rating.rating}/5
                        </Typography>
                      </Box>
                    )}
                    {hire.status === 'completed' && !hire.rating && (
                      <Button size="small" variant="outlined" startIcon={<StarRoundedIcon fontSize="small" />} onClick={() => onRateHire(hire)}>
                        {t('audits.rate_hire_action')}
                      </Button>
                    )}
                  </>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

interface RatingDialogProps {
  open: boolean;
  partnerName: string;
  stars: number;
  review: string;
  submitting: boolean;
  onStarsChange: (value: number) => void;
  onReviewChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

function RatingDialog({ open, partnerName, stars, review, submitting, onStarsChange, onReviewChange, onSubmit, onClose }: RatingDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('audits.rate_hire_title', { partner: partnerName })}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {t('audits.rate_hire_desc')}
        </Typography>
        <Rating
          value={stars}
          onChange={(_event, value) => onStarsChange(value ?? 0)}
          size="large"
          icon={<StarRoundedIcon fontSize="inherit" />}
          emptyIcon={<StarRoundedIcon fontSize="inherit" sx={{ color: 'action.disabled' }} />}
        />
        <TextField
          value={review}
          onChange={(event) => onReviewChange(event.target.value)}
          size="small"
          multiline
          minRows={3}
          placeholder={t('audits.review_placeholder')}
          slotProps={{ htmlInput: { maxLength: 1000 } }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} disabled={submitting}>
          {t('audits.confirm_hire_cancel')}
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={stars < 1} loading={submitting}>
          {t('audits.rate_submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
