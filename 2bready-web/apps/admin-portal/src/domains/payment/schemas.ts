import { z } from 'zod';

export const leadFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  phone: z.string().max(30).optional().or(z.literal('')),
  company_name: z.string().max(255).optional().or(z.literal('')),
});

export type LeadFormInput = z.input<typeof leadFormSchema>;

export const leadFormDefaults: LeadFormInput = {
  name: '',
  email: '',
  phone: '',
  company_name: '',
};
