import { z } from 'zod';

export const publicCheckInSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, 'Please enter your full name')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  customerPhone: z
    .string()
    .trim()
    .min(1, 'Please enter your contact phone number')
    .regex(
      /^\+?[0-9\s\-()]{7,20}$/,
      'Please enter a valid phone number (7-20 digits, spaces, dashes, or parentheses)',
    ),
  itemDescription: z
    .string()
    .trim()
    .min(1, 'Please describe your item and service required')
    .max(500, 'Description must be at most 500 characters'),
  workflowId: z.string().optional(),
});

export type PublicCheckInFormData = z.infer<typeof publicCheckInSchema>;

