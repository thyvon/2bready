import { z } from 'zod';

// Score stays a plain string through the form (parsed to an int in the
// submit handler) — same pattern as firm's pricing fields, which keeps the
// resolver's input/output types reconcilable with react-hook-form.
export const submitAuditSchema = z.object({
  score: z
    .string()
    .min(1, 'Score is required')
    .refine((v) => /^\d+$/.test(v), 'Score must be a whole number')
    .refine((v) => Number(v) >= 0 && Number(v) <= 100, 'Score must be between 0 and 100'),
  feedback: z.string().max(5000, 'Feedback must be under 5000 characters').optional().or(z.literal('')),
});

export type SubmitAuditFormInput = z.infer<typeof submitAuditSchema>;

export const submitAuditDefaults: SubmitAuditFormInput = {
  score: '',
  feedback: '',
};