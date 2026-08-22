'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { Breadcrumbs, SectionCard, GlowButton, EmptyState } from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';
import { useNavItems } from '@/components/layout/nav-items';
import { useToast } from '@/components/ToastProvider';
import { useAuthStore } from '@/store/auth.store';
import { PageLoader } from '@/components/PageLoader';
import {
  listSops,
  getSopEffectiveContent,
  listMySignoffs,
  listSopSignoffs,
  sendSopSignoffs,
  acknowledgeSignoff,
  type Sop,
  type EffectiveSopContent,
  type SopSignoff,
} from '@/lib/sop-api';
import { listCompanyUsers } from '@/lib/company-api';
import { formatDate } from '@/lib/utils';

// Scramble types spatie roles as `Record<string, never>` — runtime check with
// a local narrow instead of a blind cast.
function isCompanyOwner(user: ReturnType<typeof useAuthStore.getState>['user']): boolean {
  return (
    Array.isArray(user?.roles) &&
    user.roles.some((r) => typeof r === 'object' && r !== null && 'name' in r && r.name === 'company_owner')
  );
}

export default function SopsPage() {
  const { t, locale } = useTranslation();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const { all } = useNavItems();
  const item = all.find((i) => i.href === '/sops');
  const canManage = isCompanyOwner(user);

  // ─── Data ──────────────────────────────────────────────────────────────
  const [sops, setSops] = useState<Sop[]>([]);
  const [mySignoffs, setMySignoffs] = useState<SopSignoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const [sopsData, signoffsData] = await Promise.all([listSops(), listMySignoffs()]);
        if (!cancelled) {
          setSops(sopsData);
          setMySignoffs(signoffsData);
        }
      } catch {
        if (!cancelled) setLoadError(t('sop.load_error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Reader dialog ─────────────────────────────────────────────────────
  const [readingSop, setReadingSop] = useState<{ id: string; title: string; version: string } | null>(null);
  // Set when the reader was opened from a pending sign-off — shows the
  // Acknowledge action once the user has read the content.
  const [pendingSignoffToAck, setPendingSignoffToAck] = useState<SopSignoff | null>(null);
  const [content, setContent] = useState<EffectiveSopContent | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState('');
  // Guards against a stale response overwriting the reader when the user
  // opens SOPs back-to-back — only the latest request may land.
  const readRequestRef = useRef(0);

  const openReader = useCallback(
    (sop: { id: string; title: string; version: string }) => {
      setReadingSop(sop);
      setContent(null);
      setContentError('');
      setLoadingContent(true);

      const requestId = ++readRequestRef.current;
      getSopEffectiveContent(sop.id, locale)
        .then((data) => {
          if (readRequestRef.current === requestId) setContent(data);
        })
        .catch(() => {
          if (readRequestRef.current === requestId) setContentError(t('sop.content_error'));
        })
        .finally(() => {
          if (readRequestRef.current === requestId) setLoadingContent(false);
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale],
  );

  function openReaderForSignoff(signoff: SopSignoff) {
    if (!signoff.sop) return;
    setPendingSignoffToAck(signoff);
    openReader(signoff.sop);
  }

  function closeReader() {
    setReadingSop(null);
    setPendingSignoffToAck(null);
    setContent(null);
    setContentError('');
  }

  // ─── Acknowledge ───────────────────────────────────────────────────────
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  async function handleAcknowledge(signoff: SopSignoff) {
    setAcknowledgingId(signoff.id);
    try {
      await acknowledgeSignoff(signoff.id);
      toast.success(t('sop.ack_success'));
      setMySignoffs((prev) => prev.map((s) => (s.id === signoff.id ? { ...s, signed_at: new Date().toISOString() } : s)));
    } finally {
      setAcknowledgingId(null);
    }
  }

  // ─── Manage sign-offs dialog (owner) ───────────────────────────────────
  const [managingSop, setManagingSop] = useState<Sop | null>(null);
  const [signoffRows, setSignoffRows] = useState<SopSignoff[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingManage, setLoadingManage] = useState(false);
  const [sending, setSending] = useState(false);

  async function openManager(sop: Sop) {
    setManagingSop(sop);
    setLoadingManage(true);
    setSelectedIds([]);
    try {
      const rows = await listSopSignoffs(sop.id);
      setSignoffRows(rows);
      if (user?.current_company_id) {
        setEmployees(await listCompanyUsers(user.current_company_id));
      }
    } finally {
      setLoadingManage(false);
    }
  }

  function closeManager() {
    setManagingSop(null);
    setSignoffRows([]);
    setEmployees([]);
    setSelectedIds([]);
  }

  async function handleSend() {
    if (!managingSop || selectedIds.length === 0) return;
    setSending(true);
    try {
      const rows = await sendSopSignoffs(managingSop.id, selectedIds);
      setSignoffRows(rows);
      setSelectedIds([]);
      toast.success(t('sop.send_success'));
    } finally {
      setSending(false);
    }
  }

  const pendingSignoffs = mySignoffs.filter((s) => !s.signed_at);
  const doneSignoffs = mySignoffs.filter((s) => s.signed_at);

  if (loading) return <PageLoader />;

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
        items={[{ label: t('nav.overview'), href: '/' }, { label: item?.label ?? 'SOPs' }]}
      />

      {loadError && <Alert severity="error">{loadError}</Alert>}

      {/* ─── Your acknowledgments ────────────────────────────────────────── */}
      <SectionCard title={t('sop.acknowledgments_title')} subtitle={t('sop.acknowledgments_subtitle')}>
        {!loadError && pendingSignoffs.length === 0 && doneSignoffs.length === 0 ? (
          <EmptyState icon={<TaskAltOutlinedIcon />} title={t('sop.no_assignments')} description={t('sop.no_assignments_desc')} />
        ) : (
          <Box className="flex flex-col">
            {[...pendingSignoffs, ...doneSignoffs].map((signoff, index) => (
              <Box key={signoff.id}>
                {index > 0 && <Divider />}
                <Box className="flex items-center justify-between gap-4" sx={{ py: 2 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {signoff.sop?.title ?? signoff.sop_id}
                    </Typography>
                    <Box className="flex items-center gap-2" sx={{ mt: 0.5 }}>
                      <Chip
                        label={signoff.signed_at ? t('sop.acknowledged') : t('sop.pending')}
                        size="small"
                        color={signoff.signed_at ? 'success' : 'warning'}
                        variant={signoff.signed_at ? 'filled' : 'outlined'}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {signoff.signed_at
                          ? t('sop.acknowledged_at', { date: formatDate(signoff.signed_at) })
                          : signoff.sent_by
                            ? t('sop.sent_by', { name: signoff.sent_by.name })
                            : ''}
                      </Typography>
                    </Box>
                  </Box>
                  {!signoff.signed_at && (
                    <Button
                      variant="contained"
                      size="small"
                      disabled={acknowledgingId === signoff.id}
                      onClick={() => openReaderForSignoff(signoff)}
                    >
                      {t('sop.read')}
                    </Button>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </SectionCard>

      {/* ─── Reading view ────────────────────────────────────────────────── */}
      <SectionCard title={t('sop.yours_title')} subtitle={t('sop.yours_subtitle')}>
        {!loadError && sops.length === 0 ? (
          <EmptyState
            icon={<MenuBookOutlinedIcon />}
            title={t('sop.empty')}
            description={t('sop.empty_desc')}
            action={
              <GlowButton href="/journey" size="medium">
                {t('trust_badge.continue_journey')}
              </GlowButton>
            }
          />
        ) : (
          <Box className="flex flex-col">
            {sops.map((sop, index) => (
              <Box key={sop.id}>
                {index > 0 && <Divider />}
                <Box className="flex items-center justify-between gap-4" sx={{ py: 2 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {sop.title}
                    </Typography>
                    <Box className="flex items-center gap-2" sx={{ mt: 0.5 }}>
                      <Chip
                        label={sop.is_global ? t('sop.type.adopted') : t('sop.type.company')}
                        size="small"
                        variant="outlined"
                        color={sop.is_global ? 'info' : 'primary'}
                      />
                      <Typography variant="caption" color="text.secondary">
                        v{sop.version} ·{' '}
                        {sop.effective_at
                          ? t('sop.effective_from', { date: formatDate(sop.effective_at) })
                          : t('sop.effective_immediately')}
                      </Typography>
                    </Box>
                  </Box>
                  <Box className="flex items-center gap-2">
                    {canManage && (
                      <Button variant="outlined" size="small" onClick={() => void openManager(sop)}>
                        {t('sop.manage_signoffs')}
                      </Button>
                    )}
                    <Button variant="outlined" size="small" onClick={() => openReader(sop)}>
                      {t('sop.read')}
                    </Button>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </SectionCard>

      <SectionCard>
        <Box className="flex items-center gap-4">
          <Box sx={{ width: 40, height: 40, borderRadius: '8px', bgcolor: 'action.selected', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <LightbulbOutlinedIcon fontSize="small" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Need help drafting SOPs?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ADMIT Unit&apos;s compliance experts can draft your Organizational Chart, Job Descriptions, and Core SOP
              Documents for you — book a free consultation.
            </Typography>
          </Box>
          <GlowButton href="/support" size="medium">
            Request Consultation
          </GlowButton>
        </Box>
      </SectionCard>

      {/* ─── Reader dialog ───────────────────────────────────────────────── */}
      <Dialog open={!!readingSop} onClose={closeReader} maxWidth="md" fullWidth>
        <DialogTitle>
          {readingSop?.title}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            v{readingSop?.version}
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ maxHeight: '65vh' }}>
          {loadingContent ? (
            <Box className="flex justify-center" sx={{ py: 5 }}>
              <CircularProgress size={28} />
            </Box>
          ) : contentError ? (
            <Alert severity="error">{contentError}</Alert>
          ) : (
            <>
              {pendingSignoffToAck && content?.sop_id === pendingSignoffToAck.sop_id && !content.is_active && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {t('sop.draft_note')}
                </Alert>
              )}
              {content?.source === 'override' && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {t('sop.override_note')}
                </Alert>
              )}
              {content?.content && (
                <Box
                  className="[&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
                  dangerouslySetInnerHTML={{ __html: content.content }}
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          {pendingSignoffToAck && (
            <Button
              variant="contained"
              disabled={acknowledgingId !== null}
              onClick={() => {
                if (pendingSignoffToAck) void handleAcknowledge(pendingSignoffToAck);
                closeReader();
              }}
            >
              {t('sop.acknowledge')}
            </Button>
          )}
          <Button onClick={closeReader}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Manage sign-offs dialog (owner) ─────────────────────────────── */}
      <Dialog open={!!managingSop} onClose={closeManager} maxWidth="sm" fullWidth>
        <DialogTitle>{t('sop.track_title', { title: managingSop?.title ?? '' })}</DialogTitle>
        <DialogContent dividers className="flex flex-col gap-4">
          {loadingManage ? (
            <Box className="flex justify-center" sx={{ py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              <Box className="flex flex-col">
                {signoffRows.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t('sop.track_empty')}
                  </Typography>
                ) : (
                  signoffRows.map((row, index) => (
                    <Box key={row.id}>
                      {index > 0 && <Divider />}
                      <Box className="flex items-center justify-between gap-3" sx={{ py: 1.5 }}>
                        <Typography variant="body2">{row.user?.name ?? row.user?.id}</Typography>
                        <Chip
                          label={row.signed_at ? t('sop.acknowledged') : t('sop.pending')}
                          size="small"
                          color={row.signed_at ? 'success' : 'warning'}
                          variant={row.signed_at ? 'filled' : 'outlined'}
                        />
                      </Box>
                    </Box>
                  ))
                )}
              </Box>

              {employees.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    {t('sop.select_employees')}
                  </Typography>
                  <Box className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {employees.map((emp) => (
                      <FormControlLabel
                        key={emp.id}
                        control={
                          <Checkbox
                            checked={selectedIds.includes(emp.id)}
                            onChange={(e) =>
                              setSelectedIds((prev) =>
                                e.target.checked ? [...prev, emp.id] : prev.filter((id) => id !== emp.id),
                              )
                            }
                          />
                        }
                        label={<Typography variant="body2">{emp.name}</Typography>}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeManager}>{t('common.close')}</Button>
          <Button variant="contained" disabled={sending || selectedIds.length === 0} onClick={() => void handleSend()}>
            {t('sop.send')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}