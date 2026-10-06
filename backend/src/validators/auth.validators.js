import { z } from 'zod';

const email = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .max(254, 'Email must be at most 254 characters')
  .pipe(z.email('Enter a valid email address'));

// bcrypt only uses the first 72 bytes of input, so longer passwords are rejected
// instead of being silently truncated.
const newPassword = z
  .string({ error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 bytes')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number');

export const registerSchema = z.strictObject({
  fullName: z
    .string({ error: 'Full name is required' })
    .trim()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be at most 100 characters'),
  email,
  password: newPassword,
});

export const loginSchema = z.strictObject({
  email,
  password: z
    .string({ error: 'Password is required' })
    .min(1, 'Password is required')
    .max(128, 'Password must be at most 128 characters'),
});
