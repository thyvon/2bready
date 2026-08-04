'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { getApiError } from '@2bready/api-client';
import { Breadcrumbs, SectionCard, EmptyState, StatusBadge, PillToggle, cardRestShadow, cardHoverGlow } from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';
import { useNavItems } from '@/components/layout/nav-items';
import { PageLoader } from '@/components/PageLoader';
import { useToast } from '@/components/ToastProvider';
import { useJourney } from '@/components/JourneyProvider';
import { listActiveTpPartners, listMyTpHires, hireTpPartner, type TpPartner, type TpHire } from '@/lib/marketplace-api';

const LEVELS = ['L2', 'L3', 'L4'] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_PRICE_FIELD: Record<Level, keyof TpPartner> = {
  L2: 'price_l2_cents',
  L3: 'price_l3_cents',
  L4: 'price_l4_cents',
};

// Alternating tonal background for the firm-initials mark — no per-firm data
// backs a real color, so this is purely visual variety, not meaningful state.
const MARK_STYLES = [
  { bgcolor: 'action.selected', color: 'text.primary' },
  { bgcolor: (theme: { palette: { mode: string } }) => (theme.palette.mode === 'dark' ? 'rgba(0,112,243,0.16)' : 'rgba(0,112,243,0.08)'), color: 'primary.main' },
];

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/);
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase();
}

function formatCents(cents: number, currency: string): string {
  return `${currency === 'USD' ? '$' : currency + ' '}${(cents / 100).toFixed(2)}`;
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
  const unlockedLevelCodes = new Set((journey?.levels ?? []).filter((l) => l.unlocked).map((l) => l.code));

  function pathwayName(level: Level): string {
    return journey?.levels.find((l) => l.code === level)?.pathway_name ?? level;
  }

  const statusLabel: Record<string, string> = {
    pending_payment: t('audits.status_pending_payment'),
    active: t('audits.status_active'),
    completed: t('audits.status_completed'),
    cancelled: t('audits.status_cancelled'),
  };

  async function onHire(partner: TpPartner, level: Level) {
    if (!unlockedLevelCodes.has(level)) return; // button is disabled for this case; defense in depth only
    const priceCents = partner[LEVEL_PRICE_FIELD[level]] as number | null;
    if (priceCents === null) return;
    const price = formatCents(priceCents, 'USD');

    if (!window.confirm(t('audits.hire_confirm', { partner: partner.name, level, price }))) return;

    const key = `${partner.id}:${level}`;
    setHiring(key);
    try {
      await hireTpPartner(partner.id, level);
      await refreshHires();
      toast.success(t('audits.hire_success'));
    } catch (err) {
      toast.error(getApiError(err).message || t('audits.hire_error'));
    } finally {
      setHiring(null);
    }
  }

  if (loading || journeyLoading) return <PageLoader />;

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
        items={[{ label: t('nav.overview'), href: '/' }, { label: item?.label ?? 'Audits' }]}
      />

      <Typography variant="body2" color="text.secondary">
        {t('audits.subtitle')}
      </Typography>

      <SectionCard title={t('audits.your_auditor_title')}>
        {activeHires.length === 0 ? (
          <EmptyState
            icon={<HandshakeOutlinedIcon fontSize="inherit" />}
            title={t('audits.your_auditor_empty_title')}
            description={t('audits.your_auditor_empty_desc')}
          />
        ) : (
          <Box className="flex flex-col gap-3">
            {activeHires.map((hire) => (
              <Box
                key={hire.id}
                sx={{
                  borderRadius: '8px',
                  boxShadow: cardRestShadow,
                  p: 2,
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 2,
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                  '&:hover': { boxShadow: cardHoverGlow(), transform: 'translateY(-1px)' },
                }}
              >
                <Box className="flex items-center gap-2 flex-wrap">
                  <VerifiedUserOutlinedIcon sx={{ fontSize: '1.125rem', color: 'text.secondary' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {hire.tp_partner?.name ?? '—'}
                  </Typography>
                  <Box sx={{ fontSize: '0.6875rem', fontWeight: 600, px: 1, py: 0.25, borderRadius: '9999px', bgcolor: 'action.selected', color: 'text.secondary' }}>
                    {t('audits.level_label', { level: hire.journey_level })}
                  </Box>
                </Box>
                <StatusBadge status={hire.status} label={statusLabel[hire.status] ?? hire.status} />
              </Box>
            ))}
          </Box>
        )}
      </SectionCard>

      <SectionCard
        title={t('audits.marketplace_title')}
        action={
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
        }
      >
        {tpPartners.length === 0 ? (
          <EmptyState title={t('audits.marketplace_empty_title')} description={t('audits.marketplace_empty_desc')} />
        ) : (
          <Box className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {tpPartners.map((partner, index) => {
              const mark = MARK_STYLES[index % MARK_STYLES.length];
              return (
                <Box
                  key={partner.id}
                  sx={{
                    borderRadius: '8px',
                    boxShadow: cardRestShadow,
                    p: 2.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                    '&:hover': { boxShadow: cardHoverGlow(), transform: 'translateY(-2px)' },
                  }}
                >
                  <Box className="flex items-start gap-3">
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        ...mark,
                      }}
                    >
                      {initialsFor(partner.name)}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {partner.name}
                      </Typography>
                      <Box className="flex items-center gap-1" sx={{ mt: 0.5, fontSize: '0.6875rem', fontWeight: 600, color: 'primary.main' }}>
                        <VerifiedUserOutlinedIcon sx={{ fontSize: '0.875rem' }} />
                        {t('audits.verified_partner')}
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                    {LEVELS.map((level) => {
                      const priceCents = partner[LEVEL_PRICE_FIELD[level]] as number | null;
                      if (priceCents === null) return null;

                      const alreadyHiredStatus = activeHires.find((h) => h.journey_level === level)?.status;
                      const isUnlocked = unlockedLevelCodes.has(level);
                      const dimmed = levelFilter !== 'all' && levelFilter !== level;
                      const key = `${partner.id}:${level}`;

                      return (
                        <Box
                          key={level}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1.5,
                            borderRadius: '6px',
                            px: 1,
                            py: 1,
                            opacity: dimmed ? 0.4 : 1,
                            transition: 'opacity 0.2s ease, background-color 0.15s ease',
                            '&:hover': dimmed ? {} : { bgcolor: 'action.hover' },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, minWidth: 0 }}>
                            <Typography component="span" sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.75rem', color: isUnlocked ? 'text.secondary' : 'text.disabled', width: 24, flexShrink: 0 }}>
                              {level}
                            </Typography>
                            <Typography variant="body2" sx={{ color: isUnlocked ? 'text.primary' : 'text.disabled' }} noWrap>
                              {pathwayName(level)}
                            </Typography>
                          </Box>

                          <Box className="flex items-center gap-2" sx={{ flexShrink: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: isUnlocked ? 'text.primary' : 'text.disabled' }}>
                              {formatCents(priceCents, 'USD')}
                            </Typography>

                            {!isUnlocked ? (
                              <Tooltip title={t('audits.locked_tooltip', { level })}>
                                <span>
                                  <Button variant="outlined" size="small" disabled startIcon={<LockOutlinedIcon fontSize="small" />}>
                                    {t('audits.locked_label')}
                                  </Button>
                                </span>
                              </Tooltip>
                            ) : alreadyHiredStatus ? (
                              <Button variant="outlined" size="small" disabled>
                                {statusLabel[alreadyHiredStatus] ?? alreadyHiredStatus}
                              </Button>
                            ) : (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<HandshakeOutlinedIcon />}
                                loading={hiring === key}
                                onClick={() => onHire(partner, level)}
                              >
                                {t('audits.hire_button', { level })}
                              </Button>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </SectionCard>
    </Box>
  );
}
