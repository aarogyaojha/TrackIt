import { Types } from 'mongoose';
import { PlanTier } from '@trackit/types';
import { toPlanResponse } from './plan.response';
import { PlanDocument } from './plan.schema';

describe('toPlanResponse', () => {
  it('maps a PlanDocument to PlanResponse and excludes _id, __v, and internal properties', () => {
    const rawId = new Types.ObjectId();
    const updatedAt = new Date('2026-01-01T12:00:00.000Z');

    const fakePlanDoc = {
      _id: rawId,
      tier: PlanTier.BASIC,
      limits: {
        maxActiveTickets: 50,
        maxStaffUsers: 5,
        maxTicketsPerMonth: 200,
      },
      updatedAt,
      __v: 0,
    } as unknown as PlanDocument;

    const result = toPlanResponse(fakePlanDoc);

    expect(result).toEqual({
      tier: PlanTier.BASIC,
      limits: {
        maxActiveTickets: 50,
        maxStaffUsers: 5,
        maxTicketsPerMonth: 200,
      },
      updatedAt,
    });

    const keys = Object.keys(result).sort();
    expect(keys).toEqual(['limits', 'tier', 'updatedAt']);
    expect('_id' in result).toBe(false);
    expect('__v' in result).toBe(false);
  });
});
