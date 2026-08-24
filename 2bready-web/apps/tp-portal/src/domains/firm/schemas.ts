import { z } from 'zod';

// Price fields stay plain strings through the form (parsed to cents in the
// submit handler, mirroring admin-portal's tp-partner form exactly).
export const pricingSchema = z.object({
  price_l1: z.string().optional(),
  price_l2: z.string().optional(),
  price_l3: z.string().optional(),
  price_l4: z.string().optional(),
});

export type PricingFormInput = z.infer<typeof pricingSchema>;

export const firmProfileSchema = z.object({
  name: z.string().min(1, 'Firm name is required').max(255),
  name_kh: z.string().max(255).optional().or(z.literal('')),
});

export type FirmProfileFormInput = z.infer<typeof firmProfileSchema>;
