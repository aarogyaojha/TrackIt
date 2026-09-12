import { z } from 'zod';

export const verifyEmailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  otp: z
    .string()
    .min(6, 'Verification code must be 6 digits')
    .max(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain exactly 6 digits'),
});

export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;
