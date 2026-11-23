import {
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ClientSession, Types } from 'mongoose';
import { StatusCategory } from '@trackit/types';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode, ErrorMessages } from '../../constants';
import { SubscriptionsService } from '../subscriptions/subscription.service';
import { TicketsRepository } from '../tickets/ticket.repository';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import {
  DEFAULT_WORKFLOW_DESCRIPTION,
  DEFAULT_WORKFLOW_NAME,
  DEFAULT_WORKFLOW_STATUSES,
} from './workflow.constants';
import { WorkflowsRepository } from './workflow.repository';
import { WorkflowDocument, WorkflowStatus } from './workflow.schema';

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly workflowsRepository: WorkflowsRepository,
    @Inject(forwardRef(() => TicketsRepository))
    private readonly ticketsRepository: TicketsRepository,
    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  private validateStatuses(statuses: Array<{ key: string; category: StatusCategory }>): void {
    const keys = statuses.map((s) => s.key.toLowerCase().trim());
    const uniqueKeys = new Set(keys);

    if (uniqueKeys.size !== keys.length) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.DUPLICATE_WORKFLOW_STATUS_KEYS,
        ErrorMessages[ErrorCode.DUPLICATE_WORKFLOW_STATUS_KEYS],
      );
    }

    const hasInitial = statuses.some(
      (s) => s.category === StatusCategory.INITIAL,
    );
    const hasCompleted = statuses.some(
      (s) => s.category === StatusCategory.COMPLETED,
    );

    if (!hasInitial || !hasCompleted) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_WORKFLOW_STATUSES,
        ErrorMessages[ErrorCode.INVALID_WORKFLOW_STATUSES],
      );
    }
  }

  async create(
    organizationId: string | Types.ObjectId,
    dto: CreateWorkflowDto,
  ): Promise<WorkflowDocument> {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;

    const existing = await this.workflowsRepository.findByOrgAndName(
      orgObjectId,
      dto.name,
    );

    if (existing) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ErrorCode.WORKFLOW_NAME_TAKEN,
        ErrorMessages[ErrorCode.WORKFLOW_NAME_TAKEN],
      );
    }

    this.validateStatuses(dto.statuses);

    const count = await this.workflowsRepository.countByOrg(orgObjectId);
    await this.subscriptionsService.assertPlanLimit(
      orgObjectId,
      'maxWorkflows',
      count,
    );

    const isDefault = count === 0 ? true : Boolean(dto.isDefault);

    if (isDefault) {
      await this.workflowsRepository.unsetDefaultWorkflow(orgObjectId);
    }

    const formattedStatuses: WorkflowStatus[] = dto.statuses.map(
      (s, idx) => ({
        key: s.key.toLowerCase().trim(),
        name: s.name.trim(),
        customerLabel: s.customerLabel?.trim() || s.name.trim(),
        customerDescription: s.customerDescription?.trim() || '',
        category: s.category,
        color: s.color?.trim() || 'default',
        order: s.order ?? idx,
      }),
    );

    return this.workflowsRepository.create({
      organizationId: orgObjectId,
      name: dto.name.trim(),
      description: dto.description?.trim() || '',
      isDefault,
      isActive: true,
      statuses: formattedStatuses,
    });
  }

  async listByOrg(
    organizationId: string | Types.ObjectId,
    activeOnly = false,
  ): Promise<WorkflowDocument[]> {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;

    const list = await this.workflowsRepository.findByOrg(
      orgObjectId,
      activeOnly,
    );

    if (list.length === 0) {
      const defaultWf = await this.getDefaultWorkflow(orgObjectId);
      return [defaultWf];
    }

    return list;
  }

  async getByIdScoped(
    organizationId: string | Types.ObjectId,
    workflowId: string,
  ): Promise<WorkflowDocument> {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;

    const workflow = await this.workflowsRepository.findById(workflowId);

    if (!workflow || !workflow.organizationId.equals(orgObjectId)) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        ErrorMessages[ErrorCode.NOT_FOUND],
      );
    }

    return workflow;
  }

  async getDefaultWorkflow(
    organizationId: string | Types.ObjectId,
  ): Promise<WorkflowDocument> {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;

    const defaultWf =
      await this.workflowsRepository.findDefaultByOrg(orgObjectId);
    if (defaultWf) {
      return defaultWf;
    }

    const activeList = await this.workflowsRepository.findByOrg(
      orgObjectId,
      true,
    );
    if (activeList.length > 0) {
      return activeList[0];
    }

    // Auto-seed default workflow if none exists for this tenant
    return this.seedDefaultWorkflowForOrg(orgObjectId);
  }

  async update(
    organizationId: string | Types.ObjectId,
    workflowId: string,
    dto: UpdateWorkflowDto,
  ): Promise<WorkflowDocument> {
    const workflow = await this.getByIdScoped(organizationId, workflowId);
    const orgObjectId = workflow.organizationId;

    const updatePayload: Partial<WorkflowDocument> = {};

    if (dto.name && dto.name.trim() !== workflow.name) {
      const existing = await this.workflowsRepository.findByOrgAndName(
        orgObjectId,
        dto.name,
      );
      if (existing && existing._id.toString() !== workflow._id.toString()) {
        throw new AppException(
          HttpStatus.CONFLICT,
          ErrorCode.WORKFLOW_NAME_TAKEN,
          ErrorMessages[ErrorCode.WORKFLOW_NAME_TAKEN],
        );
      }
      updatePayload.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      updatePayload.description = dto.description?.trim() || '';
    }

    if (dto.isActive !== undefined) {
      if (!dto.isActive && workflow.isActive) {
        if (workflow.isDefault) {
          throw new AppException(
            HttpStatus.BAD_REQUEST,
            ErrorCode.WORKFLOW_CANNOT_DELETE_DEFAULT,
            ErrorMessages[ErrorCode.WORKFLOW_CANNOT_DELETE_DEFAULT],
          );
        }
        const inUseCount = await this.ticketsRepository.countByWorkflow(
          orgObjectId,
          workflow._id,
        );
        if (inUseCount > 0) {
          throw new AppException(
            HttpStatus.CONFLICT,
            ErrorCode.WORKFLOW_IN_USE,
            ErrorMessages[ErrorCode.WORKFLOW_IN_USE],
          );
        }
      }
      updatePayload.isActive = dto.isActive;
    }

    if (dto.statuses) {
      this.validateStatuses(dto.statuses);

      // Guard: Cannot remove a status key or change its category if tickets use it
      for (const oldStatus of workflow.statuses) {
        const oldKey = oldStatus.key.toLowerCase().trim();
        const matchingNewStatus = dto.statuses.find(
          (s) => s.key.toLowerCase().trim() === oldKey,
        );

        const isRemoved = !matchingNewStatus;
        const isCategoryChanged =
          matchingNewStatus && matchingNewStatus.category !== oldStatus.category;

        if (isRemoved || isCategoryChanged) {
          const inUse = await this.ticketsRepository.hasTicketsWithStatus(
            orgObjectId,
            workflow._id,
            oldStatus.key,
          );
          if (inUse) {
            throw new AppException(
              HttpStatus.CONFLICT,
              ErrorCode.WORKFLOW_STATUS_IN_USE,
              ErrorMessages[ErrorCode.WORKFLOW_STATUS_IN_USE],
            );
          }
        }
      }

      updatePayload.statuses = dto.statuses.map((s, idx) => ({
        key: s.key.toLowerCase().trim(),
        name: s.name.trim(),
        customerLabel: s.customerLabel?.trim() || s.name.trim(),
        customerDescription: s.customerDescription?.trim() || '',
        category: s.category,
        color: s.color?.trim() || 'default',
        order: s.order ?? idx,
      }));
    }

    if (dto.isDefault !== undefined) {
      if (dto.isDefault) {
        await this.workflowsRepository.unsetDefaultWorkflow(
          orgObjectId,
          workflow._id,
        );
        updatePayload.isDefault = true;
      } else if (workflow.isDefault) {
        // Cannot unmark the only default without setting another
        throw new AppException(
          HttpStatus.BAD_REQUEST,
          ErrorCode.WORKFLOW_CANNOT_DELETE_DEFAULT,
          ErrorMessages[ErrorCode.WORKFLOW_CANNOT_DELETE_DEFAULT],
        );
      }
    }

    const updated = await this.workflowsRepository.updateById(
      workflow._id.toString(),
      { $set: updatePayload },
    );

    return updated!;
  }

  async delete(
    organizationId: string | Types.ObjectId,
    workflowId: string,
  ): Promise<void> {
    const workflow = await this.getByIdScoped(organizationId, workflowId);

    if (workflow.isDefault) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.WORKFLOW_CANNOT_DELETE_DEFAULT,
        ErrorMessages[ErrorCode.WORKFLOW_CANNOT_DELETE_DEFAULT],
      );
    }

    const inUseCount = await this.ticketsRepository.countByWorkflow(
      organizationId,
      workflow._id,
    );

    if (inUseCount > 0) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ErrorCode.WORKFLOW_IN_USE,
        ErrorMessages[ErrorCode.WORKFLOW_IN_USE],
      );
    }

    await this.workflowsRepository.deleteById(workflow._id.toString());
  }

  async seedDefaultWorkflowForOrg(
    organizationId: string | Types.ObjectId,
    session?: ClientSession,
  ): Promise<WorkflowDocument> {
    const orgObjectId =
      typeof organizationId === 'string'
        ? new Types.ObjectId(organizationId)
        : organizationId;

    const existingDefault =
      await this.workflowsRepository.findDefaultByOrg(orgObjectId);
    if (existingDefault) {
      return existingDefault;
    }

    const statuses: WorkflowStatus[] = DEFAULT_WORKFLOW_STATUSES.map(
      (s) => ({
        key: s.key,
        name: s.name,
        customerLabel: s.customerLabel,
        customerDescription: s.customerDescription,
        category: s.category,
        color: s.color,
        order: s.order,
      }),
    );

    try {
      return await this.workflowsRepository.create(
        {
          organizationId: orgObjectId,
          name: DEFAULT_WORKFLOW_NAME,
          description: DEFAULT_WORKFLOW_DESCRIPTION,
          isDefault: true,
          isActive: true,
          statuses,
        },
        session ? { session } : undefined,
      );
    } catch (error: unknown) {
      const isDuplicateKey =
        (error as { code?: number })?.code === 11000 ||
        (error as Error)?.message?.includes('E11000');

      if (isDuplicateKey) {
        const fetchedDefault =
          await this.workflowsRepository.findDefaultByOrg(orgObjectId);
        if (fetchedDefault) {
          return fetchedDefault;
        }
      }

      throw error;
    }
  }
}

