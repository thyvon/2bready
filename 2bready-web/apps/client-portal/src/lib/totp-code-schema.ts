import { z } from 'zod';

export const totpCodeSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only digits'),
});

export type TotpCodeInput = z.infer<typeof totpCodeSchema>;
