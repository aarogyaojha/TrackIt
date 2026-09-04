import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlanTier } from '@trackit/types';
import { BaseRepository } from '../../common/database/base.repository';
import { Plan, PlanDocument } from './plan.schema';

@Injectable()
export class PlansRepository extends BaseRepository<PlanDocument> {
  constructor(
    @InjectModel(Plan.name)
    planModel: Model<PlanDocument>,
  ) {
    super(planModel);
  }

  async findByTier(tier: PlanTier): Promise<PlanDocument | null> {
    return this.findOne({ tier });
  }
}
