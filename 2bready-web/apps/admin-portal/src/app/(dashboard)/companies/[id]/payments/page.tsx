'use client';

import PaymentsListView from '@/domains/payment/components/PaymentsListView';
import { useCompanyWorkspace } from '@/domains/company/workspace-context';

export default function CompanyPaymentsPage() {
  const { company } = useCompanyWorkspace();
  return <PaymentsListView companyId={company.id} />;
}
