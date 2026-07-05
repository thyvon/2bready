'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import CompanyFormWizard from '@/domains/company/components/CompanyFormWizard';
import { registerOwnCompany } from '@/domains/company/api';
import type { CompanyFormOutput } from '@/domains/company/schemas';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/feedback/ToastProvider';
import { useTranslation } from '@/lib/i18n';

export default function CompanySetupPage() {
  const router = useRouter();
  const { token, hasRole, setAuth } = useAuthStore();
  const toast = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    // A company_owner can register more than one company (§0.7 of the MVP
    // proposal) — this page stays reachable even after they already have one,
    // unlike the old single-company assumption that redirected away once set.
    if (!hasRole('company_owner')) {
      router.replace('/company');
    }
  }, [hasRole, router]);

  const handleSubmit = async (data: CompanyFormOutput) => {
    const { company, user: updatedUser } = await registerOwnCompany({
      name: data.name,
      name_kh: data.name_kh || undefined,
      registration_no: data.registration_no || undefined,
      industry_code: data.industry_code,
      country_code: data.country_code,
      // employee_count is admin/staff-verified only — the API ignores it here regardless,
      // but omit it too so the request is honest about what self-service actually controls.
      default_locale: data.default_locale,
    });

    if (token) setAuth(updatedUser, token);
    toast.success(t('company.setup_success', { name: company.name }));
    router.push('/company');
  };

  return (
    <>
      <PageHeader title={t('company.setup_title')} />
      <SectionCard>
        <CompanyFormWizard onSubmit={handleSubmit} submitLabel={t('company.finish_setup')} hideEmployeeCount />
      </SectionCard>
    </>
  );
}
