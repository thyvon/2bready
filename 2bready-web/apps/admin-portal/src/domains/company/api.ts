import api from '@/lib/api';
import type { User } from '@/domains/auth/types';
import type { Company, CompanyListFilters, Pagination, StoreCompanyPayload, UpdateCompanyPayload } from './types';

export async function listCompanies(filters: CompanyListFilters = {}): Promise<{ companies: Company[]; pagination: Pagination }> {
  const res = await api.get<{ data: Company[]; meta: { pagination: Pagination } }>('/companies', { params: filters });
  return { companies: res.data.data, pagination: res.data.meta.pagination };
}

export async function getCompany(id: string): Promise<Company> {
  const res = await api.get<{ data: Company }>(`/companies/${id}`);
  return res.data.data;
}

export async function createCompany(data: StoreCompanyPayload): Promise<Company> {
  const res = await api.post<{ data: Company }>('/companies', data);
  return res.data.data;
}

export async function registerOwnCompany(data: StoreCompanyPayload): Promise<{ company: Company; user: User }> {
  const res = await api.post<{ data: { company: Company; user: User } }>('/companies/register', data);
  return res.data.data;
}

export async function updateCompany(id: string, data: UpdateCompanyPayload): Promise<Company> {
  const res = await api.patch<{ data: Company }>(`/companies/${id}`, data);
  return res.data.data;
}

export async function deleteCompany(id: string): Promise<void> {
  await api.delete(`/companies/${id}`);
}

export async function switchActiveCompany(id: string): Promise<User> {
  const res = await api.post<{ data: User }>(`/companies/${id}/switch`);
  return res.data.data;
}
