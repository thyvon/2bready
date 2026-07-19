import { z } from 'zod';

export const googleOAuthSettingSchema = z.object({
  enabled: z.boolean(),
  client_id: z.string().min(1, 'Client ID is required'),
  client_secret: z.string().optional().or(z.literal('')),
});

export type GoogleOAuthSettingInput = z.input<typeof googleOAuthSettingSchema>;
export type GoogleOAuthSettingOutput = z.output<typeof googleOAuthSettingSchema>;
