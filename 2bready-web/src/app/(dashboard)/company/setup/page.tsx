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
  const { user, token, hasRole, setAuth } = useAuthStore();
  const toast = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (!hasRole('company_owner') || user?.company_id) {
      router.replace('/company');
    }
  }, [hasRole, user, router]);

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
      <PageHeader title={t('company.setup_title')} subtitle={t('company.setup_subtitle')} />
      <SectionCard>
        <CompanyFormWizard onSubmit={handleSubmit} submitLabel={t('company.finish_setup')} hideEmployeeCount />
      </SectionCard>
    </>
  );
}
