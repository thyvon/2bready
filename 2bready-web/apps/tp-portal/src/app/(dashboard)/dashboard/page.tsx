'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import SectionCard from '@/components/ui/SectionCard';
import EmptyState from '@/components/ui/EmptyState';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { listMyCompanies } from '@/domains/hires/api';
import type { Company } from '@/domains/hires/types';
import { useToast } from '@/components/feedback/ToastProvider';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function DashboardPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const data = await listMyCompanies();
        if (!cancelled) setCompanies(data);
      } catch (err) {
        if (!cancelled) toast.error(getApiError(err).message);
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

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>{t('tp.dashboard_title')}</Typography>
        <Typography variant="body2" color="text.secondary">{t('tp.dashboard_subtitle')}</Typography>
      </Box>

      {loading ? (
        <LoadingOverlay />
      ) : companies.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={<ApartmentOutlinedIcon fontSize="inherit" />}
            title={t('tp.no_companies')}
            description={t('tp.no_companies_desc')}
          />
        </SectionCard>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {companies.map((company) => (
            <SectionCard key={company.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ color: 'text.secondary', display: 'flex' }}>
                    <ApartmentOutlinedIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{company.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{company.country_code}</Typography>
                  </Box>
                </Box>
                <Button
                  component={Link}
                  href={`/companies/${company.id}`}
                  variant="outlined"
                  size="small"
                  endIcon={<ArrowForwardIcon fontSize="small" />}
                >
                  {t('tp.review_documents')}
                </Button>
              </Box>
            </SectionCard>
          ))}
        </Box>
      )}
    </Box>
  );
}
