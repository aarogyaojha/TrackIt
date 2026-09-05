import { HttpStatus, Injectable } from '@nestjs/common';
import { QueryFilter, Types } from 'mongoose';
import { OrgStatus, TicketStatus } from '@trackit/types';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode, ErrorMessages } from '../../constants';
import { OrganizationsService } from '../organizations/organization.service';
import { SubscriptionsService } from '../subscriptions/subscription.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { TICKET_STATUS_TRANSITIONS } from './ticket.constants';
import { TicketsRepository } from './ticket.repository';
import { TicketDocument } from './ticket.schema';

@Injectable()
export class TicketsService {
  constructor(
    private readonly ticketsRepository: TicketsRepository,
    private readonly organizationsService: OrganizationsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async create(
    organizationId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    dto: CreateTicketDto,
  ): Promise<TicketDocument> {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;
    const userObjectId =
      typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    const subscription =
      await this.subscriptionsService.getByOrganizationId(orgObjectId);

    await this.subscriptionsService.assertPlanLimit(
      orgObjectId,
      'maxTicketsPerMonth',
      subscription.ticketsThisMonth,
    );

    const activeCount =
      await this.ticketsRepository.countActiveByOrganization(orgObjectId);

    await this.subscriptionsService.assertPlanLimit(
      orgObjectId,
      'maxActiveTickets',
      activeCount,
    );

    const code = dto.code.trim().toUpperCase();

    let ticket: TicketDocument;
    try {
      ticket = await this.ticketsRepository.create({
        organizationId: orgObjectId,
        code,
        customerName: dto.customerName.trim(),
        customerPhone: dto.customerPhone.trim(),
        itemDescription: dto.itemDescription.trim(),
        status: TicketStatus.RECEIVED,
        statusHistory: [
          {
            status: TicketStatus.RECEIVED,
            changedAt: new Date(),
            changedBy: userObjectId,
          },
        ],
        createdBy: userObjectId,
      });
    } catch (err: unknown) {
      const mongoError = err as {
        code?: number;
        name?: string;
        message?: string;
        keyPattern?: Record<string, unknown>;
        keyValue?: Record<string, unknown>;
      };

      const isDuplicate =
        mongoError.code === 11000 ||
        mongoError.name === 'MongoServerError' ||
        (typeof mongoError.message === 'string' &&
          mongoError.message.includes('E11000'));

      if (isDuplicate) {
        throw new AppException(
          HttpStatus.CONFLICT,
          ErrorCode.TICKET_CODE_TAKEN,
          ErrorMessages[ErrorCode.TICKET_CODE_TAKEN],
        );
      }

      throw err;
    }

    // Deliberate accepted eventual-consistency tradeoff: creating a ticket and
    // incrementing the monthly counter are not wrapped in a multi-document Mongoose transaction.
    await this.subscriptionsService.incrementTicketsThisMonth(orgObjectId);

    return ticket;
  }

  async listByOrg(
    organizationId: string | Types.ObjectId,
    query: ListTicketsQueryDto,
  ): Promise<{ items: TicketDocument[]; total: number }> {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;

    const filter: QueryFilter<TicketDocument> = {
      organizationId: orgObjectId,
    };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search?.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { code: searchRegex },
        { customerName: searchRegex },
      ];
    }

    return this.ticketsRepository.findPaginated(
      filter,
      { page: query.page, limit: query.limit },
      { createdAt: -1 },
    );
  }

  async getByIdScoped(
    organizationId: string | Types.ObjectId,
    ticketId: string,
  ): Promise<TicketDocument> {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;

    const ticket = await this.ticketsRepository.findById(ticketId);

    if (!ticket || !ticket.organizationId.equals(orgObjectId)) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        ErrorMessages[ErrorCode.NOT_FOUND],
      );
    }

    return ticket;
  }

  async updateStatus(
    organizationId: string | Types.ObjectId,
    ticketId: string,
    userId: string | Types.ObjectId,
    newStatus: TicketStatus,
  ): Promise<TicketDocument> {
    const ticket = await this.getByIdScoped(organizationId, ticketId);
    const userObjectId =
      typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    const allowedTransitions = TICKET_STATUS_TRANSITIONS[ticket.status] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ErrorCode.INVALID_STATUS_TRANSITION,
        ErrorMessages[ErrorCode.INVALID_STATUS_TRANSITION],
      );
    }

    const updated = await this.ticketsRepository.updateById(
      ticket._id.toString(),
      {
        $set: { status: newStatus },
        $push: {
          statusHistory: {
            status: newStatus,
            changedAt: new Date(),
            changedBy: userObjectId,
          },
        },
      },
    );

    return updated!;
  }

  async getPublicByOrgSlugAndCode(
    orgSlug: string,
    code: string,
  ): Promise<{ ticket: TicketDocument; orgName: string }> {
    const org = await this.organizationsService.getBySlug(
      orgSlug.toLowerCase().trim(),
    );

    if (!org || org.status !== OrgStatus.ACTIVE) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        ErrorMessages[ErrorCode.NOT_FOUND],
      );
    }

    const ticket = await this.ticketsRepository.findByOrgAndCode(
      org._id,
      code.trim().toUpperCase(),
    );

    if (!ticket) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        ErrorMessages[ErrorCode.NOT_FOUND],
      );
    }

    return { ticket, orgName: org.name };
  }
}
