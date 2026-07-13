'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import { Breadcrumbs, SectionCard, GlowButton } from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';
import { useNavItems } from '@/components/layout/nav-items';
import { useJourney } from '@/components/JourneyProvider';
import { PageLoader } from '@/components/PageLoader';
import { levelTotalDocs, levelVerifiedDocs } from '@/lib/journey-api';

const FEATURES = [
  { icon: <LinkOutlinedIcon fontSize="small" />, title: 'One secure link', desc: 'A single shareable link for investors, banks, or partners — no account or login required on their end.' },
  { icon: <AccessTimeOutlinedIcon fontSize="small" />, title: '7-day expiry', desc: 'Every link auto-expires 7 days after generation. Generate a fresh one whenever you need to re-share.' },
  { icon: <ShieldOutlinedIcon fontSize="small" />, title: 'Password-protected', desc: 'A one-time password is shown alongside the link at creation — required to view the room.' },
  { icon: <FilterListOutlinedIcon fontSize="small" />, title: 'L3 & L4 documents only', desc: 'Foundational L1/L2 paperwork stays private — only your Gold and Platinum-tier documents are shared.' },
];

// Real gating rule from the owner's concept file (Smart Data Room): requires
// L4 · Platinum 100% verified AND the Enterprise plan — both, not either.
// No verification/subscription tracking exists yet, so this is honestly
// locked for every company today rather than faked as available.
export default function DataRoomPage() {
  const { t } = useTranslation();
  const { all } = useNavItems();
  const item = all.find((i) => i.href === '/data-room');
  const { journey, loading } = useJourney();
  const l4 = journey?.levels.find((level) => level.code === 'L4') ?? null;
  const l4TotalDocs = l4 ? levelTotalDocs(l4) : 0;
  const l4VerifiedDocs = l4 ? levelVerifiedDocs(l4) : 0;
  const l4Milestones = l4?.milestones.length ?? 0;

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
        items={[{ label: t('nav.overview'), href: '/' }, { label: item?.label ?? 'Data Room' }]}
      />

      <Typography variant="body2" color="text.secondary">
        The Smart Data Room generates a time-limited, password-protected link so investors and banks can review your
        most advanced compliance documents without exposing your full vault.
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
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mt: 0.5 }}>
              Requires the Enterprise plan and 100% verification of L4 · {l4?.name ?? 'Platinum'} ({l4TotalDocs} documents
              across {l4Milestones} milestones). {l4VerifiedDocs} of {l4TotalDocs} verified today.
            </Typography>
          </Box>
          <Box sx={{ mt: 1 }}>
            <GlowButton href="/billing" size="medium">
              Upgrade to Enterprise →
            </GlowButton>
          </Box>
        </Box>
      </SectionCard>

      <SectionCard title="What you'll get" subtitle="Available once L4 is 100% verified on the Enterprise plan">
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
