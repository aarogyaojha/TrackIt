import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { BaseRepository } from '../../common/database/base.repository';
import { Workflow, WorkflowDocument } from './workflow.schema';

@Injectable()
export class WorkflowsRepository extends BaseRepository<WorkflowDocument> {
  constructor(
    @InjectModel(Workflow.name)
    workflowModel: Model<WorkflowDocument>,
  ) {
    super(workflowModel);
  }

  async findByOrg(
    organizationId: string | Types.ObjectId,
    activeOnly = false,
  ): Promise<WorkflowDocument[]> {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;

    const filter: QueryFilter<WorkflowDocument> = {
      organizationId: orgObjectId,
    };

    if (activeOnly) {
      filter.isActive = true;
    }

    return this.find(filter, undefined, { sort: { isDefault: -1, name: 1 } });
  }

  async findDefaultByOrg(
    organizationId: string | Types.ObjectId,
  ): Promise<WorkflowDocument | null> {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;

    return this.findOne({
      organizationId: orgObjectId,
      isDefault: true,
      isActive: true,
    });
  }

  async findByOrgAndName(
    organizationId: string | Types.ObjectId,
    name: string,
  ): Promise<WorkflowDocument | null> {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;

    return this.findOne({
      organizationId: orgObjectId,
      name: name.trim(),
    });
  }

  async countByOrg(
    organizationId: string | Types.ObjectId,
  ): Promise<number> {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;

    return this.model
      .countDocuments({
        organizationId: orgObjectId,
      })
      .exec();
  }

  async unsetDefaultWorkflow(
    organizationId: string | Types.ObjectId,
    excludeId?: string | Types.ObjectId,
  ): Promise<void> {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;

    const filter: QueryFilter<WorkflowDocument> = {
      organizationId: orgObjectId,
      isDefault: true,
    };

    if (excludeId) {
      const excludeObjectId =
        typeof excludeId === 'string'
          ? new Types.ObjectId(excludeId)
          : excludeId;
      filter._id = { $ne: excludeObjectId };
    }

    await this.model.updateMany(filter, { $set: { isDefault: false } }).exec();
  }
}

