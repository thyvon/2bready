import api from '@/lib/api';
import type { Company, CompanyEditPayload, CompanyListFilters, Industry, Pagination, StoreCompanyPayload } from './types';
import type { User } from '@/domains/user/types';

// This app only manages companies on 2bReady's behalf (admin/staff/finance) —
// self-service registration/switching (registerOwnCompany, switchActiveCompany)
// is client-portal's responsibility, not this app's. See feedback memory:
// "Client (Company owner) use only at Client portal."

export async function listCompanies(filters: CompanyListFilters = {}): Promise<{ companies: Company[]; pagination: Pagination }> {
  const res = await api.get<{ data: Company[]; meta: { pagination: Pagination } }>('/companies', { params: filters });
  return { companies: res.data.data, pagination: res.data.meta.pagination };
}

// Used to populate CompanyFormWizard's industry dropdown when admin/staff create
// or edit a company on a client's behalf.
export async function listIndustries(): Promise<Industry[]> {
  const res = await api.get<{ data: Industry[] }>('/industries');
  return res.data.data;
}

export async function getCompany(id: string): Promise<Company> {
  const res = await api.get<{ data: Company }>(`/companies/${id}`);
  return res.data.data;
}

export async function createCompany(data: StoreCompanyPayload): Promise<Company> {
  const res = await api.post<{ data: Company }>('/companies', data);
  return res.data.data;
}

export async function updateCompany(id: string, data: CompanyEditPayload): Promise<Company> {
  const res = await api.patch<{ data: Company }>(`/companies/${id}`, data);
  return res.data.data;
}

export async function deleteCompany(id: string): Promise<void> {
  await api.delete(`/companies/${id}`);
}

// Staff-side oversight of a company's own team (company_owner/company_member)
// — distinct from the internal Users page's domains/user/api.ts, which never
// touches company-side accounts at all.
export async function listCompanyUsers(companyId: string): Promise<User[]> {
  const res = await api.get<{ data: User[] }>(`/companies/${companyId}/users`);
  return res.data.data;
}

export interface UpdateCompanyUserPayload {
  status?: 'active' | 'suspended' | 'inactive';
  role?: 'company_owner' | 'company_member';
  google_auth_enabled?: boolean;
  // Tri-state override of the role-derived 2FA default — null resets to that
  // default (never required for company_owner/member), true/false forces it.
  two_factor_required?: boolean | null;
}

export async function updateCompanyUser(companyId: string, userId: string, payload: UpdateCompanyUserPayload): Promise<User> {
  const res = await api.patch<{ data: User }>(`/companies/${companyId}/users/${userId}`, payload);
  return res.data.data;
}
