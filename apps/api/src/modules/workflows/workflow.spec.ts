import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { StatusCategory } from '@trackit/types';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../constants';
import { SubscriptionsService } from '../subscriptions/subscription.service';
import { TicketsRepository } from '../tickets/ticket.repository';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { WorkflowsRepository } from './workflow.repository';
import { WorkflowDocument } from './workflow.schema';
import { WorkflowsService } from './workflow.service';

describe('WorkflowsService', () => {
  let service: WorkflowsService;
  let workflowsRepository: jest.Mocked<WorkflowsRepository>;
  let ticketsRepository: jest.Mocked<TicketsRepository>;
  let subscriptionsService: jest.Mocked<SubscriptionsService>;

  const mockOrgId = new Types.ObjectId();
  const mockWorkflowId = new Types.ObjectId();

  const mockWorkflowDoc = (
    overrides?: Partial<WorkflowDocument>,
  ): WorkflowDocument =>
    ({
      _id: mockWorkflowId,
      organizationId: mockOrgId,
      name: 'Custom Repair',
      description: 'Repair lifecycle',
      isDefault: false,
      isActive: true,
      statuses: [
        {
          key: 'received',
          name: 'Received',
          customerLabel: 'Received',
          customerDescription: 'Checked in',
          category: StatusCategory.INITIAL,
          color: 'secondary',
          order: 0,
        },
        {
          key: 'completed',
          name: 'Completed',
          customerLabel: 'Completed',
          customerDescription: 'Done',
          category: StatusCategory.COMPLETED,
          color: 'success',
          order: 1,
        },
      ],
      ...overrides,
    }) as unknown as WorkflowDocument;

  beforeEach(async () => {
    const mockWfRepo: Partial<jest.Mocked<WorkflowsRepository>> = {
      create: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findByOrg: jest.fn(),
      findDefaultByOrg: jest.fn(),
      findByOrgAndName: jest.fn(),
      countByOrg: jest.fn(),
      unsetDefaultWorkflow: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    };

    const mockTkRepo: Partial<jest.Mocked<TicketsRepository>> = {
      countByWorkflow: jest.fn(),
      hasTicketsWithStatus: jest.fn(),
    };

    const mockSubSvc: Partial<jest.Mocked<SubscriptionsService>> = {
      assertPlanLimit: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowsService,
        {
          provide: WorkflowsRepository,
          useValue: mockWfRepo,
        },
        {
          provide: TicketsRepository,
          useValue: mockTkRepo,
        },
        {
          provide: SubscriptionsService,
          useValue: mockSubSvc,
        },
      ],
    }).compile();

    service = module.get<WorkflowsService>(WorkflowsService);
    workflowsRepository = module.get(WorkflowsRepository);
    ticketsRepository = module.get(TicketsRepository);
    subscriptionsService = module.get(SubscriptionsService);
  });

  describe('create', () => {
    const createDto: CreateWorkflowDto = {
      name: 'Electronics Repair',
      description: 'For phones and laptops',
      isDefault: true,
      statuses: [
        {
          key: 'intake',
          name: 'Intake',
          category: StatusCategory.INITIAL,
          order: 0,
        },
        {
          key: 'repairing',
          name: 'Repairing',
          category: StatusCategory.IN_PROGRESS,
          order: 1,
        },
        {
          key: 'delivered',
          name: 'Delivered',
          category: StatusCategory.COMPLETED,
          order: 2,
        },
      ],
    };

    it('successfully creates workflow and unsets previous default if isDefault is true', async () => {
      workflowsRepository.findByOrgAndName.mockResolvedValue(null);
      workflowsRepository.countByOrg.mockResolvedValue(1);
      workflowsRepository.unsetDefaultWorkflow.mockResolvedValue(undefined);
      workflowsRepository.create.mockResolvedValue(mockWorkflowDoc({ isDefault: true }));

      const result = await service.create(mockOrgId, createDto);

      expect(workflowsRepository.findByOrgAndName).toHaveBeenCalledWith(
        mockOrgId,
        'Electronics Repair',
      );
      expect(subscriptionsService.assertPlanLimit).toHaveBeenCalledWith(
        mockOrgId,
        'maxWorkflows',
        1,
      );
      expect(workflowsRepository.unsetDefaultWorkflow).toHaveBeenCalledWith(mockOrgId);
      expect(workflowsRepository.create).toHaveBeenCalled();
      expect(result.isDefault).toBe(true);
    });

    it('throws PLAN_LIMIT_EXCEEDED when maxWorkflows limit is reached', async () => {
      workflowsRepository.findByOrgAndName.mockResolvedValue(null);
      workflowsRepository.countByOrg.mockResolvedValue(1);
      subscriptionsService.assertPlanLimit.mockRejectedValueOnce(
        new AppException(
          HttpStatus.CONFLICT,
          ErrorCode.PLAN_LIMIT_EXCEEDED,
          'Plan limit exceeded',
        ),
      );

      await expect(service.create(mockOrgId, createDto)).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.CONFLICT,
          response: expect.objectContaining({
            code: ErrorCode.PLAN_LIMIT_EXCEEDED,
          }),
        }),
      );
    });

    it('throws CONFLICT if workflow with same name exists in org', async () => {
      workflowsRepository.findByOrgAndName.mockResolvedValue(mockWorkflowDoc());

      await expect(service.create(mockOrgId, createDto)).rejects.toThrow(
        new AppException(
          HttpStatus.CONFLICT,
          ErrorCode.WORKFLOW_NAME_TAKEN,
          'A workflow with this name already exists for the organization',
        ),
      );
    });

    it('throws BAD_REQUEST if statuses contain duplicate keys', async () => {
      workflowsRepository.findByOrgAndName.mockResolvedValue(null);

      const invalidDto: CreateWorkflowDto = {
        ...createDto,
        statuses: [
          { key: 'same', name: 'Step 1', category: StatusCategory.INITIAL, order: 0 },
          { key: 'SAME', name: 'Step 2', category: StatusCategory.COMPLETED, order: 1 },
        ],
      };

      await expect(service.create(mockOrgId, invalidDto)).rejects.toThrow(
        new AppException(
          HttpStatus.BAD_REQUEST,
          ErrorCode.DUPLICATE_WORKFLOW_STATUS_KEYS,
          'Status keys within a workflow must be unique',
        ),
      );
    });

    it('throws BAD_REQUEST if statuses lack an INITIAL or COMPLETED status', async () => {
      workflowsRepository.findByOrgAndName.mockResolvedValue(null);

      const invalidDto: CreateWorkflowDto = {
        ...createDto,
        statuses: [
          { key: 'step1', name: 'Step 1', category: StatusCategory.IN_PROGRESS, order: 0 },
          { key: 'step2', name: 'Step 2', category: StatusCategory.COMPLETED, order: 1 },
        ],
      };

      await expect(service.create(mockOrgId, invalidDto)).rejects.toThrow(
        new AppException(
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_WORKFLOW_STATUSES,
          'Workflow must contain at least one initial status and one completed status',
        ),
      );
    });
  });

  describe('update', () => {
    it('throws 409 WORKFLOW_STATUS_IN_USE when removing a status key that is in use by tickets', async () => {
      const existingWorkflow = mockWorkflowDoc({
        isDefault: false,
        statuses: [
          { key: 'received', name: 'Received', customerLabel: 'Received', category: StatusCategory.INITIAL, color: 'default', order: 0 },
          { key: 'diagnosing', name: 'Diagnosing', customerLabel: 'Diagnosing', category: StatusCategory.IN_PROGRESS, color: 'default', order: 1 },
          { key: 'completed', name: 'Completed', customerLabel: 'Completed', category: StatusCategory.COMPLETED, color: 'default', order: 2 },
        ],
      });

      workflowsRepository.findById.mockResolvedValue(existingWorkflow);
      ticketsRepository.hasTicketsWithStatus.mockResolvedValue(true);

      const updateDto: UpdateWorkflowDto = {
        statuses: [
          { key: 'received', name: 'Received', category: StatusCategory.INITIAL, order: 0 },
          // 'diagnosing' removed
          { key: 'completed', name: 'Completed', category: StatusCategory.COMPLETED, order: 1 },
        ],
      };

      await expect(
        service.update(mockOrgId, mockWorkflowId.toString(), updateDto),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.CONFLICT,
          response: expect.objectContaining({
            code: ErrorCode.WORKFLOW_STATUS_IN_USE,
          }),
        }),
      );

      expect(ticketsRepository.hasTicketsWithStatus).toHaveBeenCalledWith(
        mockOrgId,
        existingWorkflow._id,
        'diagnosing',
      );
    });

    it('throws 409 WORKFLOW_STATUS_IN_USE when changing the category of an in-use status', async () => {
      const existingWorkflow = mockWorkflowDoc({
        isDefault: false,
        statuses: [
          { key: 'received', name: 'Received', customerLabel: 'Received', category: StatusCategory.INITIAL, color: 'default', order: 0 },
          { key: 'in_progress', name: 'In Progress', customerLabel: 'Working', category: StatusCategory.IN_PROGRESS, color: 'default', order: 1 },
          { key: 'completed', name: 'Completed', customerLabel: 'Completed', category: StatusCategory.COMPLETED, color: 'default', order: 2 },
        ],
      });

      workflowsRepository.findById.mockResolvedValue(existingWorkflow);
      ticketsRepository.hasTicketsWithStatus.mockResolvedValue(true);

      const updateDto: UpdateWorkflowDto = {
        statuses: [
          { key: 'received', name: 'Received', category: StatusCategory.INITIAL, order: 0 },
          // Changing in_progress from IN_PROGRESS category to READY category
          { key: 'in_progress', name: 'In Progress', category: StatusCategory.READY, order: 1 },
          { key: 'completed', name: 'Completed', category: StatusCategory.COMPLETED, order: 2 },
        ],
      };

      await expect(
        service.update(mockOrgId, mockWorkflowId.toString(), updateDto),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.CONFLICT,
          response: expect.objectContaining({
            code: ErrorCode.WORKFLOW_STATUS_IN_USE,
          }),
        }),
      );
    });

    it('allows updating labels and reordering when keys and categories are maintained', async () => {
      const existingWorkflow = mockWorkflowDoc({
        isDefault: false,
        statuses: [
          { key: 'received', name: 'Old Label', customerLabel: 'Old Customer', category: StatusCategory.INITIAL, color: 'default', order: 0 },
          { key: 'completed', name: 'Done', customerLabel: 'Finished', category: StatusCategory.COMPLETED, color: 'default', order: 1 },
        ],
      });

      workflowsRepository.findById.mockResolvedValue(existingWorkflow);
      workflowsRepository.updateById.mockResolvedValue(existingWorkflow);

      const updateDto: UpdateWorkflowDto = {
        statuses: [
          { key: 'received', name: 'New Label', customerLabel: 'New Customer Label', category: StatusCategory.INITIAL, order: 0 },
          { key: 'completed', name: 'Done Renamed', customerLabel: 'Finished', category: StatusCategory.COMPLETED, order: 1 },
        ],
      };

      const result = await service.update(mockOrgId, mockWorkflowId.toString(), updateDto);
      expect(result).toBeDefined();
      expect(ticketsRepository.hasTicketsWithStatus).not.toHaveBeenCalled();
    });

    it('allows removing an unused status key if tickets do not use it', async () => {
      const existingWorkflow = mockWorkflowDoc({
        isDefault: false,
        statuses: [
          { key: 'received', name: 'Received', customerLabel: 'Received', category: StatusCategory.INITIAL, color: 'default', order: 0 },
          { key: 'optional_step', name: 'Optional', customerLabel: 'Optional', category: StatusCategory.IN_PROGRESS, color: 'default', order: 1 },
          { key: 'completed', name: 'Completed', customerLabel: 'Completed', category: StatusCategory.COMPLETED, color: 'default', order: 2 },
        ],
      });

      workflowsRepository.findById.mockResolvedValue(existingWorkflow);
      ticketsRepository.hasTicketsWithStatus.mockResolvedValue(false);
      workflowsRepository.updateById.mockResolvedValue(existingWorkflow);

      const updateDto: UpdateWorkflowDto = {
        statuses: [
          { key: 'received', name: 'Received', category: StatusCategory.INITIAL, order: 0 },
          { key: 'completed', name: 'Completed', category: StatusCategory.COMPLETED, order: 1 },
        ],
      };

      const result = await service.update(mockOrgId, mockWorkflowId.toString(), updateDto);
      expect(result).toBeDefined();
      expect(ticketsRepository.hasTicketsWithStatus).toHaveBeenCalledWith(
        mockOrgId,
        existingWorkflow._id,
        'optional_step',
      );
    });

    it('throws CONFLICT if trying to deactivate a workflow in use by tickets', async () => {
      const existingWorkflow = mockWorkflowDoc({
        isActive: true,
        isDefault: false,
      });

      workflowsRepository.findById.mockResolvedValue(existingWorkflow);
      ticketsRepository.countByWorkflow.mockResolvedValue(2);

      await expect(
        service.update(mockOrgId, mockWorkflowId.toString(), { isActive: false }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.CONFLICT,
          response: expect.objectContaining({
            code: ErrorCode.WORKFLOW_IN_USE,
          }),
        }),
      );
    });
  });

  describe('delete', () => {
    it('throws BAD_REQUEST if trying to delete default workflow', async () => {
      workflowsRepository.findById.mockResolvedValue(
        mockWorkflowDoc({ isDefault: true }),
      );

      await expect(
        service.delete(mockOrgId, mockWorkflowId.toString()),
      ).rejects.toThrow(
        new AppException(
          HttpStatus.BAD_REQUEST,
          ErrorCode.WORKFLOW_CANNOT_DELETE_DEFAULT,
          'Cannot delete the default workflow. Please set another workflow as default first.',
        ),
      );
    });

    it('throws CONFLICT if tickets are currently using the workflow', async () => {
      workflowsRepository.findById.mockResolvedValue(
        mockWorkflowDoc({ isDefault: false }),
      );
      ticketsRepository.countByWorkflow.mockResolvedValue(3);

      await expect(
        service.delete(mockOrgId, mockWorkflowId.toString()),
      ).rejects.toThrow(
        new AppException(
          HttpStatus.CONFLICT,
          ErrorCode.WORKFLOW_IN_USE,
          'Cannot delete or deactivate a workflow currently in use by tickets',
        ),
      );
    });

    it('deletes workflow if not default and no tickets in use', async () => {
      workflowsRepository.findById.mockResolvedValue(
        mockWorkflowDoc({ isDefault: false }),
      );
      ticketsRepository.countByWorkflow.mockResolvedValue(0);
      workflowsRepository.deleteById.mockResolvedValue(mockWorkflowDoc());

      await service.delete(mockOrgId, mockWorkflowId.toString());

      expect(workflowsRepository.deleteById).toHaveBeenCalledWith(
        mockWorkflowId.toString(),
      );
    });
  });

  describe('seedDefaultWorkflowForOrg', () => {
    it('returns existing default workflow if one already exists', async () => {
      const existing = mockWorkflowDoc({ isDefault: true });
      workflowsRepository.findDefaultByOrg.mockResolvedValue(existing);

      const result = await service.seedDefaultWorkflowForOrg(mockOrgId);

      expect(result).toBe(existing);
      expect(workflowsRepository.create).not.toHaveBeenCalled();
    });

    it('creates and returns default workflow when none exists', async () => {
      const created = mockWorkflowDoc({ isDefault: true });
      workflowsRepository.findDefaultByOrg.mockResolvedValue(null);
      workflowsRepository.create.mockResolvedValue(created);

      const result = await service.seedDefaultWorkflowForOrg(mockOrgId);

      expect(result).toBe(created);
      expect(workflowsRepository.create).toHaveBeenCalled();
    });

    it('handles duplicate-key error race condition (11000) by re-fetching the default workflow', async () => {
      const existing = mockWorkflowDoc({ isDefault: true });

      // First call (check): none found
      // Second call (in catch): found
      workflowsRepository.findDefaultByOrg
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existing);

      const duplicateKeyError = new Error('E11000 duplicate key error collection') as Error & { code: number };
      duplicateKeyError.code = 11000;
      workflowsRepository.create.mockRejectedValueOnce(duplicateKeyError);

      const result = await service.seedDefaultWorkflowForOrg(mockOrgId);

      expect(result).toBe(existing);
      expect(workflowsRepository.findDefaultByOrg).toHaveBeenCalledTimes(2);
    });

    it('re-throws non-duplicate-key database errors', async () => {
      workflowsRepository.findDefaultByOrg.mockResolvedValue(null);
      workflowsRepository.create.mockRejectedValueOnce(new Error('Database disk error'));

      await expect(service.seedDefaultWorkflowForOrg(mockOrgId)).rejects.toThrow(
        'Database disk error',
      );
    });
  });
});

