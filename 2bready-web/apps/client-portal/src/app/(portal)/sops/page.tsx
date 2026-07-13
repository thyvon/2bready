'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import { Breadcrumbs, SectionCard, GlowButton } from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';
import { useNavItems } from '@/components/layout/nav-items';
import { useJourney } from '@/components/JourneyProvider';
import { PageLoader } from '@/components/PageLoader';
import { toDocStatus } from '@/lib/journey-api';

const FEATURES = [
  { icon: <MarkEmailReadOutlinedIcon fontSize="small" />, title: 'Send to any employee', desc: 'Email a verified SOP document directly to an employee for read & acknowledge sign-off.' },
  { icon: <PendingActionsOutlinedIcon fontSize="small" />, title: 'Track acknowledgment', desc: 'See who has acknowledged and who is still pending at a glance, per document.' },
  { icon: <HistoryOutlinedIcon fontSize="small" />, title: 'Full audit trail', desc: 'Every send and acknowledgment is logged — useful evidence for your next audit.' },
];

// Real mechanic from the owner's concept file (sopSignoffCard): only
// verified L2/L3 documents can be sent for employee sign-off — the dropdown
// there is populated exclusively from docs with status === 'verified'.
// Verification is now a real admin/auditor action and the counts below are
// real, but the send-to-employee flow itself isn't built yet, so this page
// stays honestly locked regardless of verified count until that flow
// exists — same pattern as the Data Room page.
export default function SopsPage() {
  const { t } = useTranslation();
  const { all } = useNavItems();
  const item = all.find((i) => i.href === '/sops');
  const { journey, loading } = useJourney();
  const l3 = journey?.levels.find((level) => level.code === 'L3') ?? null;
  const sopMilestone = l3?.milestones.find((m) => m.name === 'SOP & Structure') ?? null;
  const sopVerifiedDocs = sopMilestone?.documents.filter((doc) => toDocStatus(doc.status) === 'verified').length ?? 0;

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

      <Typography variant="body2" color="text.secondary">
        Send your verified Standard Operating Procedures to employees for read & sign-off acknowledgment — evidence
        your team actually follows the procedures your Trust Badge certifies.
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
    </Box>
  );
}
