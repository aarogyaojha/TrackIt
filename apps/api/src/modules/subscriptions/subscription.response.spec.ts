import { PlanTier } from '@trackit/types';
import {
  SubscriptionSummaryResponse,
  toSubscriptionSummaryResponse,
} from './subscription.response';

describe('toSubscriptionSummaryResponse', () => {
  it('shapes subscription summary correctly and excludes extra fields', () => {
    const rawSummary: SubscriptionSummaryResponse & { _id?: string; __v?: number } = {
      planTier: PlanTier.FREE,
      limits: {
        maxActiveTickets: 10,
        maxStaffUsers: 2,
        maxTicketsPerMonth: 30,
      },
      usage: {
        staffUsers: 1,
        ticketsThisMonth: 5,
        activeTickets: 0,
      },
      _id: 'fake-id',
      __v: 0,
    };

    const result = toSubscriptionSummaryResponse(rawSummary);

    expect(result).toEqual({
      planTier: PlanTier.FREE,
      limits: {
        maxActiveTickets: 10,
        maxStaffUsers: 2,
        maxTicketsPerMonth: 30,
      },
      usage: {
        staffUsers: 1,
        ticketsThisMonth: 5,
        activeTickets: 0,
      },
    });

    const keys = Object.keys(result).sort();
    expect(keys).toEqual(['limits', 'planTier', 'usage']);
    expect('_id' in result).toBe(false);
    expect('__v' in result).toBe(false);
  });
});
