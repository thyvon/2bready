import { z } from 'zod';

// Form captures prices in dollars (what an admin naturally types) — converted
// to *_price_cents at submit time, the only place this conversion should happen
// (never divide by 100 inline elsewhere; use formatCents for display).
const priceDollars = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  const n = Number(val);
  return Number.isNaN(n) ? val : n;
}, z.number().min(0, 'Must be 0 or more'));

// Form captures a whole number of display slots (what an admin naturally
// thinks in — "show this 3rd") — same shape as price_cents, no separate
// conversion needed since sort_order is already stored as a plain integer.
const sortOrder = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return 0;
  const n = Number(val);
  return Number.isNaN(n) ? val : n;
}, z.number().int().min(0, 'Must be 0 or more'));

export const packageFormSchema = z.object({
  name: z.string().min(1, 'Package name is required').max(255),
  name_kh: z.string().max(255).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
  monthly_price: priceDollars,
  yearly_price: priceDollars,
  industry_id: z.string().optional().or(z.literal('')),
  journey_level_id: z.string().optional().or(z.literal('')),
  tier: z.enum(['free', 'starter', 'pro', 'enterprise']),
  is_active: z.boolean(),
  sort_order: sortOrder,
});

export type PackageFormInput = z.input<typeof packageFormSchema>;
export type PackageFormOutput = z.output<typeof packageFormSchema>;

export const packageFormDefaults: PackageFormInput = {
  name: '',
  name_kh: '',
  description: '',
  monthly_price: 0,
  yearly_price: 0,
  industry_id: '',
  journey_level_id: '',
  tier: 'starter',
  is_active: true,
  sort_order: 0,
};
