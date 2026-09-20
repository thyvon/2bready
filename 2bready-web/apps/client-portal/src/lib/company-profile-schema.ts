import { z } from 'zod';

export const companyProfileSchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255),
  name_kh: z.string().max(255).optional().or(z.literal('')),
  registration_no: z.string().max(100).optional().or(z.literal('')),
  industry_id: z.string().min(1, 'Industry is required'),
  country_code: z.string().length(2, 'Use a 2-letter country code'),
  compliance_start_date: z.string().optional().or(z.literal('')),
  default_locale: z.enum(['en', 'kh']),
});

export type CompanyProfileInput = z.input<typeof companyProfileSchema>;
export type CompanyProfileOutput = z.output<typeof companyProfileSchema>;

export const companyProfileDefaults: CompanyProfileInput = {
  name: '',
  name_kh: '',
  registration_no: '',
  industry_id: '',
  country_code: 'KH',
  compliance_start_date: '',
  default_locale: 'en',
};
