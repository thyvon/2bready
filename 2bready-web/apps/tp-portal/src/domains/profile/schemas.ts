import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address'),
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

export type UpdateProfileFormInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordFormInput = z.infer<typeof changePasswordSchema>;
