import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '../../common/database/base.repository';
import { Subscription, SubscriptionDocument } from './subscription.schema';

@Injectable()
export class SubscriptionsRepository extends BaseRepository<SubscriptionDocument> {
  constructor(
    @InjectModel(Subscription.name)
    subscriptionModel: Model<SubscriptionDocument>,
  ) {
    super(subscriptionModel);
  }

  async findByOrganizationId(
    organizationId: string | Types.ObjectId,
  ): Promise<SubscriptionDocument | null> {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;

    return this.findOne({ organizationId: orgObjectId });
  }
}
