'use client';

import CompanyUsersListView from '@/domains/company/components/CompanyUsersListView';
import { useCompanyWorkspace } from '@/domains/company/workspace-context';

export default function CompanyUsersPage() {
  const { company } = useCompanyWorkspace();
  return <CompanyUsersListView companyId={company.id} />;
}
