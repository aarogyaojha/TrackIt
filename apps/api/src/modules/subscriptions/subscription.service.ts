import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientSession, Types } from 'mongoose';
import { PlanLimits, PlanTier } from '@trackit/types';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode, ErrorMessages } from '../../constants';
import { PlansService } from '../plans/plan.service';
import { TicketsRepository } from '../tickets/ticket.repository';
import { UsersRepository } from '../users/user.repository';
import { WorkflowsRepository } from '../workflows/workflow.repository';
import { SubscriptionSummaryResponse } from './subscription.response';
import { SubscriptionsRepository } from './subscription.repository';
import { SubscriptionDocument } from './subscription.schema';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly plansService: PlansService,
    private readonly usersRepository: UsersRepository,
    @Inject(forwardRef(() => WorkflowsRepository))
    private readonly workflowsRepository: WorkflowsRepository,
    @Inject(forwardRef(() => TicketsRepository))
    private readonly ticketsRepository?: TicketsRepository,
  ) {}

  async createDefaultSubscription(
    organizationId: string | Types.ObjectId,
    session?: ClientSession,
  ): Promise<SubscriptionDocument> {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;

    return this.subscriptionsRepository.create(
      {
        organizationId: orgObjectId,
        planTier: PlanTier.FREE,
        ticketsThisMonth: 0,
        currentPeriodStart: new Date(),
      },
      session ? { session } : undefined,
    );
  }

  async getByOrganizationId(
    organizationId: string | Types.ObjectId,
  ): Promise<SubscriptionDocument> {
    const subscription =
      await this.subscriptionsRepository.findByOrganizationId(organizationId);

    if (!subscription) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        ErrorMessages[ErrorCode.NOT_FOUND],
      );
    }

    return subscription;
  }

  async changeTier(
    organizationId: string | Types.ObjectId,
    newTier: PlanTier,
  ): Promise<SubscriptionDocument> {
    const subscription = await this.getByOrganizationId(organizationId);

    const updated = await this.subscriptionsRepository.updateById(
      subscription._id.toString(),
      {
        $set: { planTier: newTier },
      },
    );

    return updated || subscription;
  }

  async getUsageSummary(
    organizationId: string | Types.ObjectId,
  ): Promise<SubscriptionSummaryResponse> {
    const subscription = await this.getByOrganizationId(organizationId);
    const plan = await this.plansService.getByTier(subscription.planTier);
    const staffCount =
      await this.usersRepository.countByOrganizationId(organizationId);
    const workflowsCount =
      await this.workflowsRepository.countByOrg(organizationId);
    const activeTicketsCount = this.ticketsRepository
      ? await this.ticketsRepository.countActiveByOrganization(organizationId)
      : 0;

    return {
      planTier: subscription.planTier,
      limits: plan.limits,
      usage: {
        staffUsers: staffCount,
        ticketsThisMonth: subscription.ticketsThisMonth,
        activeTickets: activeTicketsCount,
        workflows: workflowsCount,
      },
    };
  }

  async assertPlanLimit(
    organizationId: string | Types.ObjectId,
    limitKey: keyof PlanLimits,
    currentUsage: number,
  ): Promise<void> {
    const subscription = await this.getByOrganizationId(organizationId);
    const plan = await this.plansService.getByTier(subscription.planTier);

    const limitValue = plan.limits[limitKey];
    if (currentUsage >= limitValue) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ErrorCode.PLAN_LIMIT_EXCEEDED,
        ErrorMessages[ErrorCode.PLAN_LIMIT_EXCEEDED],
      );
    }
  }

  async incrementTicketsThisMonth(
    organizationId: string | Types.ObjectId,
  ): Promise<void> {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;

    await this.subscriptionsRepository.updateOne(
      { organizationId: orgObjectId },
      { $inc: { ticketsThisMonth: 1 } },
    );
  }

  async resetMonthlyUsageCounters(): Promise<{
    matchedCount: number;
    modifiedCount: number;
  }> {
    return this.subscriptionsRepository.updateMany(
      {},
      {
        $set: {
          ticketsThisMonth: 0,
          currentPeriodStart: new Date(),
        },
      },
    );
  }
}

