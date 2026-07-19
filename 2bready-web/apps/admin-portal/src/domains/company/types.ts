import type { components } from '@2bready/api-client';

export type Company = components['schemas']['CompanyResource'];
export type CompanyStatus = components['schemas']['CompanyStatus'];
export type StoreCompanyPayload = components['schemas']['StoreCompanyRequest'];
export type UpdateCompanyPayload = components['schemas']['UpdateCompanyRequest'];
export type Industry = components['schemas']['IndustryResource'];

// Scramble can't see the conditional `if ($this->user()?->hasAnyRole(...))`
// branch in the backend's UpdateCompanyRequest::rules(), so the generated
// UpdateCompanyPayload omits `status`/`employee_count` even though the
// backend genuinely accepts both from admin/staff/finance callers — which is
// exactly who this app is for. Widened locally rather than hand-editing the
// generated file or touching Scramble annotations.
export type CompanyEditPayload = UpdateCompanyPayload & {
  status?: CompanyStatus;
  employee_count?: number | null;
};

export type Pagination = {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
};

export type CompanyListFilters = {
  status?: CompanyStatus;
  country_code?: string;
  industry_id?: string;
  search?: string;
};
