import { z } from 'zod';

export const registerSchema = z
  .object({
    orgName: z
      .string()
      .trim()
      .min(1, 'Organization name is required')
      .min(2, 'Organization name must be at least 2 characters')
      .max(100, 'Organization name must be at most 100 characters'),
    adminName: z
      .string()
      .trim()
      .min(1, 'Admin name is required')
      .min(2, 'Admin name must be at least 2 characters')
      .max(100, 'Admin name must be at most 100 characters'),
    adminEmail: z
      .string()
      .trim()
      .min(1, 'Admin email is required')
      .email('Please enter a valid email address'),
    /**
     * Password complexity rules mirrored from apps/api/src/modules/organizations/organization.constants.ts
     * Keep in sync with backend PASSWORD_PATTERN and MAX_PASSWORD_LENGTH.
     * Bcrypt silently truncates beyond 72 bytes, so a 72-character ceiling is enforced.
     */
    adminPassword: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters long')
      .max(72, 'Password must be at most 72 characters long')
      .regex(
        /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.adminPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
