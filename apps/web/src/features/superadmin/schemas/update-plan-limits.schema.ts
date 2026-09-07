import { z } from 'zod';

export const updatePlanLimitsSchema = z.object({
  maxActiveTickets: z.coerce
    .number()
    .int('Must be an integer')
    .min(0, 'Must be at least 0'),
  maxStaffUsers: z.coerce
    .number()
    .int('Must be an integer')
    .min(0, 'Must be at least 0'),
  maxTicketsPerMonth: z.coerce
    .number()
    .int('Must be an integer')
    .min(0, 'Must be at least 0'),
});

export type UpdatePlanLimitsFormData = z.infer<typeof updatePlanLimitsSchema>;
export type UpdatePlanLimitsInput = z.input<typeof updatePlanLimitsSchema>;
