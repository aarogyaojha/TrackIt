import { Logger } from '@nestjs/common';
import { StatusCategory, TicketStatus } from '@trackit/types';
import { Types } from 'mongoose';
import { executeBackfill } from './backfill-workflows';

describe('backfill-workflows script', () => {
  const silentLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  const defaultStatuses = [
    { key: 'RECEIVED', category: StatusCategory.INITIAL },
    { key: 'IN_PROGRESS', category: StatusCategory.IN_PROGRESS },
    { key: 'READY', category: StatusCategory.READY },
    { key: 'DELIVERED', category: StatusCategory.COMPLETED },
    { key: 'CANCELLED', category: StatusCategory.CANCELLED },
  ];

  it('creates default workflow for orgs without one and backfills legacy tickets with correct status mappings', async () => {
    const orgAId = new Types.ObjectId();
    const orgBId = new Types.ObjectId();

    const wfAId = new Types.ObjectId();
    const wfBId = new Types.ObjectId();

    const oldTicket1 = {
      _id: new Types.ObjectId(),
      status: TicketStatus.RECEIVED,
    };
    const oldTicket2 = {
      _id: new Types.ObjectId(),
      status: TicketStatus.IN_PROGRESS,
    };
    const oldTicket3 = {
      _id: new Types.ObjectId(),
      status: TicketStatus.READY,
    };
    const oldTicket4 = {
      _id: new Types.ObjectId(),
      status: TicketStatus.DELIVERED,
    };
    const oldTicket5 = {
      _id: new Types.ObjectId(),
      status: TicketStatus.CANCELLED,
    };
    const oldTicket6 = {
      _id: new Types.ObjectId(),
      status: 'CUSTOM_UNKNOWN',
    };

    const mockOrgs = [
      { _id: orgAId, name: 'Org A' },
      { _id: orgBId, name: 'Org B' },
    ];

    const orgAWorkflow = {
      _id: wfAId,
      statuses: defaultStatuses,
    };

    const orgBWorkflow = {
      _id: wfBId,
      statuses: defaultStatuses,
    };

    const orgsRepo = {
      find: jest.fn().mockResolvedValue(mockOrgs),
    };

    // Org A has no default workflow; Org B already has one
    const workflowsRepo = {
      findDefaultByOrg: jest
        .fn()
        .mockImplementation(async (orgId: Types.ObjectId) => {
          if (orgId.equals(orgBId)) {
            return orgBWorkflow;
          }
          return null;
        }),
    };

    const workflowsService = {
      seedDefaultWorkflowForOrg: jest
        .fn()
        .mockImplementation(async (orgId: Types.ObjectId) => {
          if (orgId.equals(orgAId)) {
            return orgAWorkflow;
          }
          return orgBWorkflow;
        }),
    };

    const ticketsRepo = {
      findLegacyTicketsByOrg: jest
        .fn()
        .mockImplementation(async (orgId: Types.ObjectId) => {
          if (orgId.equals(orgAId)) {
            return [oldTicket1, oldTicket2, oldTicket3, oldTicket4, oldTicket5, oldTicket6];
          }
          return [];
        }),
      backfillTicket: jest.fn().mockResolvedValue({}),
    };

    const result = await executeBackfill(
      {
        orgsRepo,
        workflowsRepo,
        workflowsService,
        ticketsRepo,
      },
      silentLogger,
    );

    expect(result.orgsProcessed).toBe(2);
    expect(result.workflowsCreated).toBe(1);
    expect(result.ticketsBackfilled).toBe(6);

    expect(workflowsService.seedDefaultWorkflowForOrg).toHaveBeenCalledWith(orgAId);
    expect(workflowsService.seedDefaultWorkflowForOrg).not.toHaveBeenCalledWith(orgBId);

    // Verify correct mapping and org-scoping for each ticket
    expect(ticketsRepo.backfillTicket).toHaveBeenCalledWith(
      oldTicket1._id,
      orgAId,
      wfAId,
      'RECEIVED',
      StatusCategory.INITIAL,
    );
    expect(ticketsRepo.backfillTicket).toHaveBeenCalledWith(
      oldTicket2._id,
      orgAId,
      wfAId,
      'IN_PROGRESS',
      StatusCategory.IN_PROGRESS,
    );
    expect(ticketsRepo.backfillTicket).toHaveBeenCalledWith(
      oldTicket3._id,
      orgAId,
      wfAId,
      'READY',
      StatusCategory.READY,
    );
    expect(ticketsRepo.backfillTicket).toHaveBeenCalledWith(
      oldTicket4._id,
      orgAId,
      wfAId,
      'DELIVERED',
      StatusCategory.COMPLETED,
    );
    expect(ticketsRepo.backfillTicket).toHaveBeenCalledWith(
      oldTicket5._id,
      orgAId,
      wfAId,
      'CANCELLED',
      StatusCategory.CANCELLED,
    );
    // Unknown status falls back to INITIAL
    expect(ticketsRepo.backfillTicket).toHaveBeenCalledWith(
      oldTicket6._id,
      orgAId,
      wfAId,
      'RECEIVED',
      StatusCategory.INITIAL,
    );
  });

  it('is idempotent when re-run on already backfilled database', async () => {
    const orgId = new Types.ObjectId();
    const wfId = new Types.ObjectId();

    const orgsRepo = {
      find: jest.fn().mockResolvedValue([{ _id: orgId, name: 'Org A' }]),
    };
    const workflowsRepo = {
      findDefaultByOrg: jest.fn().mockResolvedValue({
        _id: wfId,
        statuses: defaultStatuses,
      }),
    };
    const workflowsService = {
      seedDefaultWorkflowForOrg: jest.fn(),
    };
    const ticketsRepo = {
      findLegacyTicketsByOrg: jest.fn().mockResolvedValue([]),
      backfillTicket: jest.fn(),
    };

    const result = await executeBackfill(
      {
        orgsRepo,
        workflowsRepo,
        workflowsService,
        ticketsRepo,
      },
      silentLogger,
    );

    expect(result.orgsProcessed).toBe(1);
    expect(result.workflowsCreated).toBe(0);
    expect(result.ticketsBackfilled).toBe(0);
    expect(workflowsService.seedDefaultWorkflowForOrg).not.toHaveBeenCalled();
    expect(ticketsRepo.backfillTicket).not.toHaveBeenCalled();
  });
});

