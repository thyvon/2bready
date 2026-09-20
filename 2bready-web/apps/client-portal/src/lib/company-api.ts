import api from '@/lib/api';
import type { components } from '@2bready/api-client';
import type { AuthUser } from '@/lib/auth-api';

export type Company = components['schemas']['CompanyResource'];
export type StoreCompanyPayload = components['schemas']['StoreCompanyRequest'];

// Self-service company registration — the API lets an authenticated
// company_owner call this any number of times (adds another company rather
// than replacing one), so this isn't gated behind "only if the user has no
// company yet" here; that's a decision for whatever calls this, not this
// function.
export async function registerOwnCompany(data: StoreCompanyPayload): Promise<{ company: Company; user: AuthUser }> {
  const res = await api.post<{ data: { company: Company; user: AuthUser } }>('/companies/register', data);
  return res.data.data;
}

// Switches which of the user's own companies is active (current_company_id) —
// same token stays valid, only the user record's current_company_id/companies
// change, so the caller just needs to re-store the returned user.
export async function switchActiveCompany(companyId: string): Promise<AuthUser> {
  const res = await api.post<{ data: AuthUser }>(`/companies/${companyId}/switch`);
  return res.data.data;
}

export type UpdateCompanyPayload = {
  name?: string;
  name_kh?: string | null;
  registration_no?: string | null;
  compliance_start_date?: string | null;
  industry_id?: string;
  country_code?: string;
  default_locale?: string;
};

export async function updateCompany(companyId: string, data: UpdateCompanyPayload): Promise<Company> {
  const res = await api.patch<{ data: Company }>(`/companies/${companyId}`, data);
  return res.data.data;
}

// Team members of a company (company_owner + company_member roles) — used for
// e.g. the SOP sign-off employee picker.
export async function listCompanyUsers(
  companyId: string,
): Promise<Array<{ id: string; name: string; email: string }>> {
  const res = await api.get<{ data: Array<{ id: string; name: string; email: string }> }>(
    `/companies/${companyId}/users`,
  );
  return res.data.data;
}
