import { z } from 'zod';

// Mirrors RegisterRequest on 2bready-api: name, email, password (min 8, mixed
// case, at least one number — Password::min(8)->mixedCase()->numbers()).
// Checking this client-side too so a weak password fails fast instead of
// surfacing only after a round trip.
export const registerSchema = z
  .object({
    name: z.string().min(1, 'Your name is required').max(255),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Include at least one lowercase letter')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[0-9]/, 'Include at least one number'),
    password_confirmation: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const registerDefaults: RegisterInput = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
};
