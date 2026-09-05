import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
        status: { $in: ACTIVE_TICKET_STATUSES },
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
}
