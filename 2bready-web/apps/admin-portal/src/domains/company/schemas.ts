import { z } from 'zod';

// Empty-string-safe optional number, since a MUI TextField always yields a string.
const optionalEmployeeCount = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  const n = Number(val);
  return Number.isNaN(n) ? val : n;
}, z.number().int('Must be a whole number').min(0, 'Must be 0 or more').optional());

export const companyFormSchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255),
  name_kh: z.string().max(255).optional().or(z.literal('')),
  registration_no: z.string().max(100).optional().or(z.literal('')),
  industry_id: z.string().min(1, 'Industry is required'),
  country_code: z.string().length(2, 'Use a 2-letter country code'),
  employee_count: optionalEmployeeCount,
  default_locale: z.enum(['en', 'kh']),
});

export type CompanyFormInput = z.input<typeof companyFormSchema>;
export type CompanyFormOutput = z.output<typeof companyFormSchema>;

export const COMPANY_FORM_STEPS = [
  { labelKey: 'company.step_identity', fields: ['name', 'name_kh', 'registration_no'] as const },
  { labelKey: 'company.step_profile', fields: ['industry_id', 'country_code', 'employee_count'] as const },
  { labelKey: 'company.step_review', fields: ['default_locale'] as const },
] as const;

export const companyFormDefaults: CompanyFormInput = {
  name: '',
  name_kh: '',
  registration_no: '',
  industry_id: '',
  country_code: 'KH',
  employee_count: undefined,
  default_locale: 'en',
};
