import { z } from 'zod';

export const createTicketSchema = z.object({
  code: z
    .string()
    .min(1, 'Ticket code is required')
    .max(50, 'Ticket code must be at most 50 characters')
    .trim(),
  customerName: z
    .string()
    .min(1, 'Customer name is required')
    .trim(),
  customerPhone: z
    .string()
    .min(1, 'Customer phone is required')
    .trim(),
  itemDescription: z
    .string()
    .min(1, 'Item description is required')
    .trim(),
});

export type CreateTicketFormData = z.infer<typeof createTicketSchema>;
