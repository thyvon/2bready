import type { components } from '@2bready/api-client';

export type Company = components['schemas']['CompanyResource'];
export type CompanyStatus = components['schemas']['CompanyStatus'];
export type StoreCompanyPayload = components['schemas']['StoreCompanyRequest'];
export type UpdateCompanyPayload = components['schemas']['UpdateCompanyRequest'];

export type Pagination = {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
};

export type CompanyListFilters = {
  status?: CompanyStatus;
  country_code?: string;
  industry_code?: string;
  search?: string;
};
