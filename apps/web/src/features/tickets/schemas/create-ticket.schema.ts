import { z } from 'zod';

export const createTicketSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Ticket code is required')
    .max(50, 'Ticket code must be at most 50 characters'),
  customerName: z
    .string()
    .trim()
    .min(1, 'Customer name is required')
    .min(2, 'Customer name must be at least 2 characters')
    .max(100, 'Customer name must be at most 100 characters'),
  /**
   * Phone format regex mirrored from apps/api/src/modules/tickets/ticket.constants.ts
   * Keep in sync with backend PHONE_NUMBER_PATTERN.
   */
  customerPhone: z
    .string()
    .trim()
    .min(1, 'Customer phone is required')
    .regex(
      /^\+?[0-9\s\-()]{7,20}$/,
      'Please enter a valid phone number (7-20 digits, spaces, dashes, or parentheses)',
    ),
  itemDescription: z
    .string()
    .trim()
    .min(1, 'Item description is required')
    .max(500, 'Item description must be at most 500 characters'),
});

export type CreateTicketFormData = z.infer<typeof createTicketSchema>;
