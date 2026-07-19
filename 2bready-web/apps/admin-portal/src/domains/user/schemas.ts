import { z } from 'zod';
import { INTERNAL_ROLES } from './types';

const roleEnum = z.enum(INTERNAL_ROLES);

export const createUserSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string().min(1, 'Please confirm the password'),
    roles: z.array(roleEnum).min(1, 'Select at least one role'),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  status: z.enum(['active', 'suspended', 'inactive']),
  roles: z.array(roleEnum).min(1, 'Select at least one role'),
  google_auth_enabled: z.boolean(),
  // Tri-state: null keeps the role-derived default, true/false forces it.
  two_factor_required: z.boolean().nullable(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
