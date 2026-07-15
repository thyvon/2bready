'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import SectionCard from '@/components/ui/SectionCard';
import { useIndustries } from '@/domains/company/hooks';
import { industryLabel, optionLabel, COUNTRY_OPTIONS } from '@/domains/company/constants';
import { formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useCompanyWorkspace } from '@/domains/company/workspace-context';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box className="flex items-center justify-between gap-4 py-2">
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
    </Box>
  );
}

export default function CompanyOverviewPage() {
  const { company } = useCompanyWorkspace();
  const { t, locale } = useTranslation();
  const { industries } = useIndustries();

  const industry = industries.find((i) => i.id === company.industry_id);

  return (
    <SectionCard title={t('company.details')}>
      <DetailRow label={t('company.name')} value={company.name} />
      {company.name_kh && <DetailRow label={t('company.name_kh')} value={company.name_kh} />}
      <DetailRow label={t('company.registration_no')} value={company.registration_no ?? '—'} />
      <DetailRow label={t('company.industry')} value={industry ? industryLabel(industry, locale) : '—'} />
      <DetailRow label={t('company.country')} value={optionLabel(t, COUNTRY_OPTIONS, company.country_code)} />
      <DetailRow label={t('company.employee_count')} value={company.employee_count != null ? String(company.employee_count) : '—'} />
      <DetailRow label={t('company.compliance_score')} value={String(company.compliance_score)} />
      <DetailRow label={t('company.registered_on')} value={company.created_at ? formatDate(company.created_at) : '—'} />
    </SectionCard>
  );
}
