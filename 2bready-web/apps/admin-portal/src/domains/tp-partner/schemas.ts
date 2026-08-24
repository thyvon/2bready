import { z } from 'zod';

// Price fields stay plain strings through the form (parsed to cents in the
// submit handler) — z.coerce.number() produces a resolver input/output type
// mismatch react-hook-form's Resolver<T> can't reconcile with an optional
// '' fallback.
export const tpPartnerFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  name_kh: z.string().max(255).optional().or(z.literal('')),
  price_l1: z.string().optional(),
  price_l2: z.string().optional(),
  price_l3: z.string().optional(),
  price_l4: z.string().optional(),
});

export const tpPartnerFormDefaults = {
  name: '',
  name_kh: '',
  price_l1: '',
  price_l2: '',
  price_l3: '',
  price_l4: '',
};

export type TpPartnerFormInput = z.infer<typeof tpPartnerFormSchema>;

export const registerAuditorFormSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string().min(1, 'Please confirm the password'),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

export type RegisterAuditorFormInput = z.infer<typeof registerAuditorFormSchema>;
