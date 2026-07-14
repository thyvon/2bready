'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/feedback/ToastProvider';
import { getCompany } from '@/domains/company/api';
import type { Company } from '@/domains/company/types';
import { getCompanyJourney, completeMilestone } from '@/domains/journey/api';
import type { Journey } from '@/domains/journey/types';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

const PILLAR_LABEL: Record<string, string> = {
  comply: 'Comply',
  scale: 'Scale',
  lead: 'Lead',
};

export default function CompanyJourneyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { hasAnyRole } = useAuthStore();
  const toast = useToast();
  const { t } = useTranslation();

  const [company, setCompany] = useState<Company | null>(null);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [signingOff, setSigningOff] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!hasAnyRole(['admin', 'staff', 'finance'])) router.replace('/dashboard');
  }, [hasAnyRole, router]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        const [companyData, journeyData] = await Promise.all([
          getCompany(params.id),
          getCompanyJourney(params.id).catch((err) => {
            // A 404 here just means this company has no matching journey
            // template yet (e.g. no industry configured for its country) —
            // that's an expected state, not a load failure.
            if (getApiError(err).message.includes('No journey found')) return null;
            throw err;
          }),
        ]);
        if (!cancelled) {
          setCompany(companyData);
          setJourney(journeyData);
        }
      } catch (err) {
        if (!cancelled) setLoadError(getApiError(err).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [params.id, reloadKey]);

  const handleSignOff = async (milestoneId: string) => {
    setSigningOff(milestoneId);
    try {
      await completeMilestone(params.id, milestoneId);
      toast.success('Milestone signed off.');
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setSigningOff(null);
    }
  };

  if (loading) {
    return (
      <Box className="flex justify-center py-16">
        <CircularProgress />
      </Box>
    );
  }

  if (loadError || !company) {
    return (
      <>
        <PageHeader title={t('admin.companies_title')} />
        <Alert severity="error">{loadError || 'Company not found.'}</Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader title={`${company.name} — Journey`} />

      {!journey ? (
        <SectionCard>
          <Typography color="text.secondary">
            No journey template matches this company&apos;s country/industry yet.
          </Typography>
        </SectionCard>
      ) : (
        <Box className="flex flex-col gap-4">
          {journey.levels.map((level) => (
            <SectionCard key={level.id}>
              <Box className="flex items-center justify-between gap-2" sx={{ mb: 2 }}>
                <Box className="flex items-center gap-1.5">
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {level.code} · {level.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {level.pathway_name}
                  </Typography>
                </Box>
                <Box className="flex items-center gap-1">
                  <Chip size="small" label={PILLAR_LABEL[level.pillar] ?? level.pillar} />
                  {!level.unlocked && (
                    <Chip
                      size="small"
                      icon={<LockOutlinedIcon sx={{ fontSize: '0.875rem' }} />}
                      label="Locked"
                      color="default"
                    />
                  )}
                </Box>
              </Box>

              <Box className="flex flex-col gap-1">
                {level.milestones.map((milestone) => (
                  <Box
                    key={milestone.id}
                    className="flex items-center gap-1.5"
                    sx={{ opacity: level.unlocked ? 1 : 0.5 }}
                  >
                    <Checkbox
                      checked={milestone.completed}
                      disabled={!level.unlocked || milestone.completed || signingOff === milestone.id}
                      onChange={() => handleSignOff(milestone.id)}
                      size="small"
                    />
                    <Typography
                      variant="body2"
                      sx={{ textDecoration: milestone.completed ? 'line-through' : 'none' }}
                    >
                      {milestone.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </SectionCard>
          ))}
        </Box>
      )}
    </>
  );
}
