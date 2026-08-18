import { z } from 'zod';

// Vault PIN schemas are factories, not one static object — the digit-count
// comes from platform_settings (vault_pin_length, seed 6), so the validation
// must match whatever length the server is configured for, not a hardcoded 6.

const pinField = (length: number, message: string) =>
  z
    .string()
    .regex(new RegExp(`^\\d{${length}}$`), message);

export const vaultUnlockSchema = (length: number, message: string) =>
  z.object({
    pin: pinField(length, message),
  });

export const vaultSetPinSchema = (length: number, message: string, mismatch: string) =>
  z
    .object({
      pin: pinField(length, message),
      confirm_pin: z.string(),
    })
    .refine((data) => data.pin === data.confirm_pin, {
      path: ['confirm_pin'],
      message: mismatch,
    });

export type VaultUnlockInput = z.infer<ReturnType<typeof vaultUnlockSchema>>;
export type VaultSetPinInput = z.infer<ReturnType<typeof vaultSetPinSchema>>;