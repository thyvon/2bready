'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import CompanyFormWizard from '@/domains/company/components/CompanyFormWizard';
import { createCompany } from '@/domains/company/api';
import type { CompanyFormOutput } from '@/domains/company/schemas';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/feedback/ToastProvider';
import { useTranslation } from '@/lib/i18n';

export default function NewCompanyPage() {
  const router = useRouter();
  const { hasAnyRole } = useAuthStore();
  const toast = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (!hasAnyRole(['admin', 'staff', 'finance'])) router.replace('/company');
  }, [hasAnyRole, router]);

  const handleSubmit = async (data: CompanyFormOutput) => {
    const company = await createCompany({
      name: data.name,
      name_kh: data.name_kh || undefined,
      registration_no: data.registration_no || undefined,
      industry_code: data.industry_code,
      country_code: data.country_code,
      employee_count: data.employee_count,
      default_locale: data.default_locale,
    });
    toast.success(`${company.name} was created.`);
    router.push('/admin/companies');
  };

  return (
    <>
      <PageHeader title={t('admin.new_company')} />
      <SectionCard>
        <CompanyFormWizard onSubmit={handleSubmit} submitLabel={t('company.create_company')} />
      </SectionCard>
    </>
  );
}
