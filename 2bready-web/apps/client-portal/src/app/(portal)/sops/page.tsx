'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { Breadcrumbs, SectionCard, GlowButton, EmptyState } from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';
import { useNavItems } from '@/components/layout/nav-items';
import { useJourney } from '@/components/JourneyProvider';
import { PageLoader } from '@/components/PageLoader';
import { toDocStatus } from '@/lib/journey-api';
import { listSops, getSopEffectiveContent, type Sop, type EffectiveSopContent } from '@/lib/sop-api';
import { formatDate } from '@/lib/utils';

const FEATURES = [
  { icon: <MarkEmailReadOutlinedIcon fontSize="small" />, title: 'Send to any employee', desc: 'Email a verified SOP document directly to an employee for read & acknowledge sign-off.' },
  { icon: <PendingActionsOutlinedIcon fontSize="small" />, title: 'Track acknowledgment', desc: 'See who has acknowledged and who is still pending at a glance, per document.' },
  { icon: <HistoryOutlinedIcon fontSize="small" />, title: 'Full audit trail', desc: 'Every send and acknowledgment is logged — useful evidence for your next audit.' },
];

// Real mechanic from the owner's concept file (sopSignoffCard): only
// verified L2/L3 documents can be sent for employee sign-off — the dropdown
// there is populated exclusively from docs with status === 'verified'.
// Verification is now a real admin/auditor action and the counts below are
// real, but the send-to-employee flow itself isn't built yet, so that section
// stays honestly locked regardless of verified count until that flow
// exists — same pattern as the Data Room page. Reading adopted/company SOPs,
// by contrast, is live: the backend resolves each company's effective content
// (adoption override > SOP content, Khmer falls back to English).
export default function SopsPage() {
  const { t, locale } = useTranslation();
  const { all } = useNavItems();
  const item = all.find((i) => i.href === '/sops');
  const { journey, loading } = useJourney();
  const l3 = journey?.levels.find((level) => level.code === 'L3') ?? null;
  const sopMilestone = l3?.milestones.find((m) => m.name === 'SOP & Structure') ?? null;
  const sopVerifiedDocs = sopMilestone?.documents.filter((doc) => toDocStatus(doc.status) === 'verified').length ?? 0;

  const [sops, setSops] = useState<Sop[]>([]);
  const [loadingSops, setLoadingSops] = useState(true);
  const [sopsError, setSopsError] = useState('');

  const [readingSop, setReadingSop] = useState<Sop | null>(null);
  const [content, setContent] = useState<EffectiveSopContent | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const data = await listSops();
        if (!cancelled) setSops(data);
      } catch {
        if (!cancelled) setSopsError(t('sop.load_error'));
      } finally {
        if (!cancelled) setLoadingSops(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

    // Guards against a stale response overwriting the reader when the user
  // opens SOPs back-to-back — only the latest request may land.
  const readRequestRef = useRef(0);

  const openReader = useCallback(
    (sop: Sop) => {
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

  function closeReader() {
    setReadingSop(null);
    setContent(null);
    setContentError('');
  }

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

      {/* ─── Reading view — live ─────────────────────────────────────────── */}
      <SectionCard title={t('sop.yours_title')} subtitle={t('sop.yours_subtitle')}>
        {loadingSops ? (
          <Box className="flex justify-center" sx={{ py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : sopsError ? (
          <Alert severity="error">{sopsError}</Alert>
        ) : sops.length === 0 ? (
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
                  <Button variant="outlined" size="small" onClick={() => openReader(sop)}>
                    {t('sop.read')}
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </SectionCard>

      {/* ─── Sign-off workflow — honestly locked until built (Sprint 8) ──── */}
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
            <Typography variant="h6">Locked</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460, mt: 0.5 }}>
              Requires at least one verified document from L3 · {l3?.name ?? 'Gold'}&apos;s {sopMilestone?.name ?? 'SOP & Structure'}{' '}
              milestone — {sopMilestone?.documents.map((doc) => doc.name).join(', ') ?? ''}. {sopVerifiedDocs} verified today.
            </Typography>
          </Box>
          <Box sx={{ mt: 1 }}>
            <GlowButton href="/journey" size="medium">
              View Compliance Journey →
            </GlowButton>
          </Box>
        </Box>
      </SectionCard>

      <SectionCard title="What you'll get" subtitle="Available once a SOP & Structure document is verified">
        <Box className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              {!content?.is_active && (
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
          <Button onClick={closeReader}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}