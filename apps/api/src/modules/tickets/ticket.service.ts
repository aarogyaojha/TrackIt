import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { QueryFilter, Types } from 'mongoose';
import { OrgStatus, StatusCategory, TicketStatus } from '@trackit/types';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode, ErrorMessages } from '../../constants';
import { OrganizationsService } from '../organizations/organization.service';
import { SubscriptionsService } from '../subscriptions/subscription.service';
import { WorkflowsService } from '../workflows/workflow.service';
import { WorkflowDocument } from '../workflows/workflow.schema';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { PublicCreateTicketDto } from './dto/public-create-ticket.dto';
import { TICKET_STATUS_TRANSITIONS } from './ticket.constants';
import { TicketsRepository } from './ticket.repository';
import { TicketDocument } from './ticket.schema';
import { PublicIntakeInfoResponse } from './ticket.response';

@Injectable()
export class TicketsService {
  constructor(
    private readonly ticketsRepository: TicketsRepository,
    private readonly organizationsService: OrganizationsService,
    private readonly subscriptionsService: SubscriptionsService,
    @Inject(forwardRef(() => WorkflowsService))
    private readonly workflowsService: WorkflowsService,
  ) { }

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

    let workflow: WorkflowDocument | null = null;
    if (dto.workflowId) {
      workflow = await this.workflowsService.getByIdScoped(
        orgObjectId,
        dto.workflowId,
      );
    } else {
      workflow = await this.workflowsService.getDefaultWorkflow(orgObjectId);
    }

    const initialStatus =
      workflow?.statuses?.find((s) => s.category === StatusCategory.INITIAL) ||
      workflow?.statuses?.[0];

    const statusCode = initialStatus ? initialStatus.key : TicketStatus.RECEIVED;
    const statusCat = initialStatus?.category || StatusCategory.INITIAL;

    let ticket: TicketDocument;
    try {
      ticket = await this.ticketsRepository.create({
        organizationId: orgObjectId,
        workflowId: workflow?._id,
        code,
        customerName: dto.customerName.trim(),
        customerPhone: dto.customerPhone.trim(),
        itemDescription: dto.itemDescription.trim(),
        status: statusCode,
        statusCategory: statusCat,
        statusHistory: [
          {
            status: statusCode,
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

    if (query.workflowId) {
      filter.workflowId = new Types.ObjectId(query.workflowId);
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
    newStatus: string,
  ): Promise<TicketDocument> {
    const ticket = await this.getByIdScoped(organizationId, ticketId);
    const orgObjectId = ticket.organizationId;
    const userObjectId =
      typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    let workflow: WorkflowDocument | null = null;
    if (ticket.workflowId) {
      try {
        workflow = await this.workflowsService.getByIdScoped(
          orgObjectId,
          ticket.workflowId.toString(),
        );
      } catch {
        workflow = await this.workflowsService.getDefaultWorkflow(orgObjectId);
      }
    } else {
      workflow = await this.workflowsService.getDefaultWorkflow(orgObjectId);
    }

    const targetStatus = workflow?.statuses?.find(
      (s) => s.key.toLowerCase() === newStatus.toLowerCase().trim(),
    );

    let isAllowed = false;
    const currentStatusItem = workflow?.statuses?.find(
      (s) => s.key.toLowerCase() === ticket.status.toLowerCase(),
    );

    if (currentStatusItem) {
      if (
        currentStatusItem.category === StatusCategory.COMPLETED ||
        currentStatusItem.category === StatusCategory.CANCELLED
      ) {
        throw new AppException(
          HttpStatus.CONFLICT,
          ErrorCode.INVALID_STATUS_TRANSITION,
          ErrorMessages[ErrorCode.INVALID_STATUS_TRANSITION],
        );
      }

      if (targetStatus) {
        if (targetStatus.category === StatusCategory.CANCELLED) {
          isAllowed = true;
        } else {
          const sorted = [...(workflow?.statuses || [])].sort(
            (a, b) => a.order - b.order,
          );
          const curIdx = sorted.findIndex(
            (s) => s.key.toLowerCase() === currentStatusItem.key.toLowerCase(),
          );
          const targetIdx = sorted.findIndex(
            (s) => s.key.toLowerCase() === targetStatus.key.toLowerCase(),
          );

          if (targetIdx === curIdx + 1) {
            isAllowed = true;
          }
        }
      }
    } else {
      const legacyAllowed =
        TICKET_STATUS_TRANSITIONS[ticket.status as TicketStatus] || [];
      if (legacyAllowed.includes(newStatus as TicketStatus)) {
        isAllowed = true;
      }
    }

    if (!isAllowed) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ErrorCode.INVALID_STATUS_TRANSITION,
        ErrorMessages[ErrorCode.INVALID_STATUS_TRANSITION],
      );
    }

    const finalStatusCode =
      targetStatus && targetStatus.key.toUpperCase() === newStatus.toUpperCase()
        ? newStatus
        : targetStatus?.key || newStatus;
    const finalCategory = targetStatus?.category;

    const updateFields: Record<string, unknown> = {
      status: finalStatusCode,
    };
    if (finalCategory && (ticket.workflowId || ticket.statusCategory)) {
      updateFields.statusCategory = finalCategory;
    }

    const updated = await this.ticketsRepository.updateById(
      ticket._id.toString(),
      {
        $set: updateFields,
        $push: {
          statusHistory: {
            status: finalStatusCode,
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
  ): Promise<{
    ticket: TicketDocument;
    orgName: string;
    workflow?: WorkflowDocument;
  }> {
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

    let workflow: WorkflowDocument | null = null;
    try {
      workflow = ticket.workflowId
        ? await this.workflowsService.getByIdScoped(
          org._id,
          ticket.workflowId.toString(),
        )
        : await this.workflowsService.getDefaultWorkflow(org._id);
    } catch {
      workflow = null;
    }

    return { ticket, orgName: org.name, workflow: workflow || undefined };
  }

  async getPublicOrgInfo(orgSlug: string): Promise<{
    organizationName: string;
    orgSlug: string;
  }> {
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

    return {
      organizationName: org.name,
      orgSlug: org.slug,
    };
  }

  async lookupPublic(
    orgSlug: string,
    rawQuery: string,
  ): Promise<{
    tickets: Array<{
      ticket: TicketDocument;
      orgName: string;
      workflow?: WorkflowDocument;
    }>;
  }> {
    const query = (rawQuery || '').trim();
    if (!query) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        ErrorMessages[ErrorCode.NOT_FOUND],
      );
    }

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

    // 1. Try by exact code or prefixed TK-code
    let directTicket = await this.ticketsRepository.findByOrgAndCode(
      org._id,
      query.toUpperCase(),
    );

    if (!directTicket && !query.toUpperCase().startsWith('TK-')) {
      directTicket = await this.ticketsRepository.findByOrgAndCode(
        org._id,
        `TK-${query.toUpperCase()}`,
      );
    }

    let foundTickets: TicketDocument[] = [];
    if (directTicket) {
      foundTickets = [directTicket];
    } else {
      // 2. Try by customer phone
      foundTickets = await this.ticketsRepository.findByOrgAndPhone(
        org._id,
        query,
      );
    }

    if (!foundTickets || foundTickets.length === 0) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        ErrorMessages[ErrorCode.NOT_FOUND],
      );
    }

    const results = await Promise.all(
      foundTickets.map(async (t) => {
        let workflow: WorkflowDocument | null = null;
        try {
          workflow = t.workflowId
            ? await this.workflowsService.getByIdScoped(
                org._id,
                t.workflowId.toString(),
              )
            : await this.workflowsService.getDefaultWorkflow(org._id);
        } catch {
          workflow = null;
        }
        return { ticket: t, orgName: org.name, workflow: workflow || undefined };
      }),
    );

    return { tickets: results };
  }

  async getPublicIntakeInfo(orgSlug: string): Promise<PublicIntakeInfoResponse> {
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

    const allWorkflows = await this.workflowsService.listByOrg(org._id, true);
    const activeWorkflows = (allWorkflows || [])
      .filter((wf: WorkflowDocument) => wf.isActive)
      .map((wf: WorkflowDocument) => ({
        id: wf._id.toString(),
        name: wf.name,
        description: wf.description,
        isDefault: wf.isDefault,
      }));

    return {
      organizationName: org.name,
      orgSlug: org.slug,
      workflows: activeWorkflows,
    };
  }

  async createPublicTicket(
    orgSlug: string,
    dto: PublicCreateTicketDto,
  ): Promise<{
    ticket: TicketDocument;
    orgName: string;
    workflow?: WorkflowDocument;
  }> {
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

    const orgObjectId = org._id;

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

    let workflow: WorkflowDocument | null = null;
    if (dto.workflowId) {
      try {
        workflow = await this.workflowsService.getByIdScoped(
          orgObjectId,
          dto.workflowId,
        );
        if (!workflow.isActive) {
          workflow = await this.workflowsService.getDefaultWorkflow(orgObjectId);
        }
      } catch {
        workflow = await this.workflowsService.getDefaultWorkflow(orgObjectId);
      }
    } else {
      workflow = await this.workflowsService.getDefaultWorkflow(orgObjectId);
    }

    const initialStatus =
      workflow?.statuses?.find((s) => s.category === StatusCategory.INITIAL) ||
      workflow?.statuses?.[0];

    const statusCode = initialStatus ? initialStatus.key : TicketStatus.RECEIVED;
    const statusCat = initialStatus?.category || StatusCategory.INITIAL;

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let ticket: TicketDocument | null = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      let rand = '';
      for (let i = 0; i < 6; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const candidateCode = `TK-${rand}`;

      const existing = await this.ticketsRepository.findByOrgAndCode(
        orgObjectId,
        candidateCode,
      );
      if (existing) {
        continue;
      }

      try {
        ticket = await this.ticketsRepository.create({
          organizationId: orgObjectId,
          workflowId: workflow?._id,
          code: candidateCode,
          customerName: dto.customerName.trim(),
          customerPhone: dto.customerPhone.trim(),
          itemDescription: dto.itemDescription.trim(),
          status: statusCode,
          statusCategory: statusCat,
          statusHistory: [
            {
              status: statusCode,
              changedAt: new Date(),
            },
          ],
        });
        break;
      } catch (err: unknown) {
        const mongoError = err as { code?: number };
        if (mongoError.code === 11000) {
          continue;
        }
        throw err;
      }
    }

    if (!ticket) {
      const fallbackCode = `TK-${Date.now().toString(36).toUpperCase()}`;
      ticket = await this.ticketsRepository.create({
        organizationId: orgObjectId,
        workflowId: workflow?._id,
        code: fallbackCode,
        customerName: dto.customerName.trim(),
        customerPhone: dto.customerPhone.trim(),
        itemDescription: dto.itemDescription.trim(),
        status: statusCode,
        statusCategory: statusCat,
        statusHistory: [
          {
            status: statusCode,
            changedAt: new Date(),
          },
        ],
      });
    }

    await this.subscriptionsService.incrementTicketsThisMonth(orgObjectId);

    return { ticket, orgName: org.name, workflow: workflow || undefined };
  }
}
