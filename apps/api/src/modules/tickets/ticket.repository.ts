import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StatusCategory } from '@trackit/types';
import { BaseRepository } from '../../common/database/base.repository';
import { ACTIVE_TICKET_STATUSES } from './ticket.constants';
import { Ticket, TicketDocument } from './ticket.schema';

@Injectable()
export class TicketsRepository extends BaseRepository<TicketDocument> {
  constructor(
    @InjectModel(Ticket.name)
    ticketModel: Model<TicketDocument>,
  ) {
    super(ticketModel);
  }

  async countActiveByOrganization(
    organizationId: string | Types.ObjectId,
  ): Promise<number> {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;

    return this.model
      .countDocuments({
        organizationId: orgObjectId,
        $or: [
          {
            statusCategory: {
              $in: [
                StatusCategory.INITIAL,
                StatusCategory.IN_PROGRESS,
                StatusCategory.READY,
              ],
            },
          },
          {
            $or: [
              { statusCategory: { $exists: false } },
              { statusCategory: null },
            ],
            status: { $in: ACTIVE_TICKET_STATUSES },
          },
        ],
      })
      .exec();
  }

  async countByWorkflow(
    organizationId: string | Types.ObjectId,
    workflowId: string | Types.ObjectId,
  ): Promise<number> {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;
    const wfObjectId =
      typeof workflowId === 'string'
        ? new Types.ObjectId(workflowId)
        : workflowId;

    return this.model
      .countDocuments({
        organizationId: orgObjectId,
        workflowId: wfObjectId,
      })
      .exec();
  }

  async findByOrgAndCode(
    organizationId: string | Types.ObjectId,
    code: string,
  ): Promise<TicketDocument | null> {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;

    return this.findOne({
      organizationId: orgObjectId,
      code: code.trim().toUpperCase(),
    });
  }

  async findByOrgAndPhone(
    organizationId: string | Types.ObjectId,
    phone: string,
  ): Promise<TicketDocument[]> {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;

    return this.find(
      {
        organizationId: orgObjectId,
        customerPhone: phone.trim(),
      },
      { sort: { createdAt: -1 }, limit: 10 },
    );
  }

  async findLegacyTicketsByOrg(
    organizationId: string | Types.ObjectId,
  ): Promise<TicketDocument[]> {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;

    return this.find({
      organizationId: orgObjectId,
      $or: [
        { workflowId: null },
        { workflowId: { $exists: false } },
        { statusCategory: null },
        { statusCategory: { $exists: false } },
      ],
    });
  }

  async backfillTicket(
    ticketId: string | Types.ObjectId,
    organizationId: string | Types.ObjectId,
    workflowId: Types.ObjectId,
    status: string,
    statusCategory: StatusCategory,
  ): Promise<TicketDocument | null> {
    const tId =
      typeof ticketId === 'string' ? new Types.ObjectId(ticketId) : ticketId;
    const orgId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;

    return this.model
      .findOneAndUpdate(
        { _id: tId, organizationId: orgId },
        { $set: { workflowId, status, statusCategory } },
        { new: true },
      )
      .exec();
  }

  async hasTicketsWithStatus(
    organizationId: string | Types.ObjectId,
    workflowId: string | Types.ObjectId,
    statusKey: string,
  ): Promise<boolean> {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;
    const wfObjectId =
      typeof workflowId === 'string'
        ? new Types.ObjectId(workflowId)
        : workflowId;
    const normalizedKey = statusKey.trim().toUpperCase();

    const count = await this.model
      .countDocuments({
        organizationId: orgObjectId,
        workflowId: wfObjectId,
        $or: [
          { status: normalizedKey },
          { 'statusHistory.status': normalizedKey },
        ],
      })
      .exec();

    return count > 0;
  }

  async getDashboardStatsRaw(organizationId: string | Types.ObjectId) {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;

    const [
      categoryCounts,
      workflowStageCounts,
      createdCounts,
      updateCounts,
      completedCounts,
      recentTickets,
    ] = await Promise.all([
      this.model.aggregate<{ _id: string | null; count: number }>([
        { $match: { organizationId: orgObjectId } },
        { $group: { _id: '$statusCategory', count: { $sum: 1 } } },
      ]),
      this.model.aggregate<{
        _id: { workflowId: Types.ObjectId | null; status: string };
        count: number;
      }>([
        { $match: { organizationId: orgObjectId } },
        {
          $group: {
            _id: { workflowId: '$workflowId', status: '$status' },
            count: { $sum: 1 },
          },
        },
      ]),
      this.model.aggregate<{ _id: Types.ObjectId; count: number }>([
        {
          $match: {
            organizationId: orgObjectId,
            createdBy: { $exists: true, $ne: null },
          },
        },
        { $group: { _id: '$createdBy', count: { $sum: 1 } } },
      ]),
      this.model.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { organizationId: orgObjectId } },
        { $unwind: '$statusHistory' },
        {
          $match: {
            'statusHistory.changedBy': { $exists: true, $ne: null },
          },
        },
        { $group: { _id: '$statusHistory.changedBy', count: { $sum: 1 } } },
      ]),
      this.model.aggregate<{ _id: Types.ObjectId; count: number }>([
        {
          $match: {
            organizationId: orgObjectId,
            statusCategory: StatusCategory.COMPLETED,
          },
        },
        { $unwind: '$statusHistory' },
        {
          $group: {
            _id: '$_id',
            lastChangedBy: { $last: '$statusHistory.changedBy' },
          },
        },
        {
          $match: {
            lastChangedBy: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: '$lastChangedBy',
            count: { $sum: 1 },
          },
        },
      ]),
      this.find(
        { organizationId: orgObjectId },
        { sort: { updatedAt: -1 }, limit: 5 },
      ),
    ]);

    return {
      categoryCounts,
      workflowStageCounts,
      createdCounts,
      updateCounts,
      completedCounts,
      recentTickets,
    };
  }
}
