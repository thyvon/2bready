import { z } from 'zod';

// Form captures price in dollars (what an admin naturally types) — converted to
// price_cents at submit time, the only place this conversion should happen
// (never divide by 100 inline elsewhere; use formatCents for display).
const priceDollars = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  const n = Number(val);
  return Number.isNaN(n) ? val : n;
}, z.number().min(0, 'Must be 0 or more'));

export const packageFormSchema = z.object({
  name: z.string().min(1, 'Package name is required').max(255),
  name_kh: z.string().max(255).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
  price: priceDollars,
  billing_period: z.enum(['monthly', 'yearly', 'one_time']),
  is_active: z.boolean(),
});

export type PackageFormInput = z.input<typeof packageFormSchema>;
export type PackageFormOutput = z.output<typeof packageFormSchema>;

export const packageFormDefaults: PackageFormInput = {
  name: '',
  name_kh: '',
  description: '',
  price: 0,
  billing_period: 'monthly',
  is_active: true,
};
