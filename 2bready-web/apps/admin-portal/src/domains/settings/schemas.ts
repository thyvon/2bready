import { z } from 'zod';

export const googleOAuthSettingSchema = z.object({
  enabled: z.boolean(),
  client_id: z.string().min(1, 'Client ID is required'),
  client_secret: z.string().optional().or(z.literal('')),
});

export type GoogleOAuthSettingInput = z.input<typeof googleOAuthSettingSchema>;
export type GoogleOAuthSettingOutput = z.output<typeof googleOAuthSettingSchema>;

export const mailSettingSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.coerce.number().int().min(1, 'Port is required').max(65535),
  username: z.string().optional().or(z.literal('')),
  password: z.string().optional().or(z.literal('')),
  encryption: z.enum(['tls', 'ssl', '']),
  from_address: z.string().min(1, 'From address is required').email('Enter a valid email'),
  from_name: z.string().min(1, 'From name is required'),
});

export type MailSettingInput = z.input<typeof mailSettingSchema>;
export type MailSettingOutput = z.output<typeof mailSettingSchema>;
