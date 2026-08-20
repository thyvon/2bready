import { z } from 'zod';

// SOP form schema. effective_at is a MUI date-input string (YYYY-MM-DD), so we
// only validate it as a plain string here and leave the date parsing to the
// backend; empty string is normalized to undefined by the dialog before submit.

const baseSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }).max(255),
  version: z.string().min(1, { message: 'Version is required' }).max(50),
  content_en: z.string().min(1, { message: 'English content is required' }),
  content_kh: z.string().nullable().optional(),
  effective_at: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  company_id: z.string().nullable().optional(),
});

export const createSopSchema = baseSchema;

export const updateSopSchema = baseSchema.partial();

export type CreateSopInput = z.infer<typeof createSopSchema>;
export type UpdateSopInput = z.infer<typeof updateSopSchema>;

export const adoptSopSchema = z.object({
  override_content_en: z.string().nullable().optional(),
  override_content_kh: z.string().nullable().optional(),
});

export type AdoptSopInput = z.infer<typeof adoptSopSchema>;