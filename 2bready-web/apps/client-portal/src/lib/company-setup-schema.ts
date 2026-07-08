import { z } from 'zod';

// Mirrors 2bready-api's Company migration fields (name, name_kh, industry_code,
// country_code — see Sprint 2 proposal notes) and the field set already proven
// out in admin-portal's CompanyFormWizard, adapted for self-service: no
// employee_count here. That field feeds CompanyBypassEvaluator's compliance
// bypass threshold on the backend, which the API silently ignores unless the
// caller is admin/staff/finance — showing it to a company_owner would be a
// control with no effect, so it's omitted rather than disabled.
export const companySetupSchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255),
  name_kh: z.string().max(255).optional().or(z.literal('')),
  registration_no: z.string().max(100).optional().or(z.literal('')),
  industry_code: z.string().min(1, 'Industry is required').max(50),
  country_code: z.string().length(2, 'Use a 2-letter country code'),
});

export type CompanySetupInput = z.input<typeof companySetupSchema>;
export type CompanySetupOutput = z.output<typeof companySetupSchema>;

export const COMPANY_SETUP_STEPS = [
  { label: 'Company Identity', fields: ['name', 'name_kh', 'registration_no'] as const },
  { label: 'Business Profile', fields: ['industry_code', 'country_code'] as const },
  { label: 'Review', fields: [] as const },
] as const;

export const companySetupDefaults: CompanySetupInput = {
  name: '',
  name_kh: '',
  registration_no: '',
  industry_code: '',
  country_code: 'KH',
};

interface Option {
  value: string;
  label: string;
}

// Coarse categories, not the full CSIC sub-level dataset (876 codes) — same
// scope as admin-portal's INDUSTRY_OPTIONS. The real industry_codes reference
// table (mined from the CSIC CSV) is explicitly deferred, not forgotten —
// see project memory on the CSIC dataset discussion.
export const INDUSTRY_OPTIONS: Option[] = [
  { value: 'F&B', label: 'Food & Beverage' },
  { value: 'RETAIL', label: 'Retail & Trade' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'SERVICES', label: 'Services' },
  { value: 'OTHER', label: 'Other' },
];

export const COUNTRY_OPTIONS: Option[] = [
  { value: 'KH', label: 'Cambodia' },
  { value: 'VN', label: 'Vietnam' },
  { value: 'TH', label: 'Thailand' },
  { value: 'XX', label: 'Other' },
];

export function optionLabel(options: Option[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
