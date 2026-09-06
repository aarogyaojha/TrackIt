import { z } from 'zod';

export const registerSchema = z
  .object({
    orgName: z.string().min(1, 'Organization name is required'),
    adminName: z.string().min(1, 'Admin name is required'),
    adminEmail: z
      .string()
      .min(1, 'Admin email is required')
      .email('Please enter a valid email address'),
    adminPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.adminPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
