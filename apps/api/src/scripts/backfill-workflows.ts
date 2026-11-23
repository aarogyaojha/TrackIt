import { INestApplicationContext, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { StatusCategory } from '@trackit/types';
import { Types } from 'mongoose';
import { AppModule } from '../app.module';
import { OrganizationsRepository } from '../modules/organizations/organization.repository';
import { TicketsRepository } from '../modules/tickets/ticket.repository';
import { WorkflowsRepository } from '../modules/workflows/workflow.repository';
import { WorkflowsService } from '../modules/workflows/workflow.service';

export interface BackfillDependencies {
  orgsRepo: {
    find: (filter: Record<string, unknown>) => Promise<Array<{ _id: Types.ObjectId; name: string }>>;
  };
  workflowsRepo: {
    findDefaultByOrg: (
      orgId: Types.ObjectId,
    ) => Promise<{
      _id: Types.ObjectId;
      statuses: Array<{ key: string; category: StatusCategory }>;
    } | null>;
  };
  workflowsService: {
    seedDefaultWorkflowForOrg: (
      orgId: Types.ObjectId,
    ) => Promise<{
      _id: Types.ObjectId;
      statuses: Array<{ key: string; category: StatusCategory }>;
    }>;
  };
  ticketsRepo: {
    findLegacyTicketsByOrg: (
      orgId: Types.ObjectId,
    ) => Promise<Array<{ _id: Types.ObjectId; status?: string }>>;
    backfillTicket: (
      ticketId: Types.ObjectId,
      orgId: Types.ObjectId,
      workflowId: Types.ObjectId,
      status: string,
      statusCategory: StatusCategory,
    ) => Promise<unknown>;
  };
}

export async function executeBackfill(
  deps: BackfillDependencies,
  logger: Logger = new Logger('BackfillWorkflows'),
): Promise<{
  orgsProcessed: number;
  workflowsCreated: number;
  ticketsBackfilled: number;
}> {
  const orgs = await deps.orgsRepo.find({});
  let workflowsCreated = 0;
  let totalTicketsBackfilled = 0;

  logger.log(`Starting workflow backfill for ${orgs.length} organization(s)...`);

  for (const org of orgs) {
    let defaultWorkflow = await deps.workflowsRepo.findDefaultByOrg(org._id);
    if (!defaultWorkflow) {
      defaultWorkflow = await deps.workflowsService.seedDefaultWorkflowForOrg(
        org._id,
      );
      workflowsCreated++;
      logger.log(`Created default workflow for organization "${org.name}" (${org._id})`);
    }

    const legacyTickets = await deps.ticketsRepo.findLegacyTicketsByOrg(org._id);
    let orgTicketsBackfilled = 0;

    for (const ticket of legacyTickets) {
      const legacyStatus = (ticket.status || '').toUpperCase();
      const matchingStatus =
        defaultWorkflow.statuses.find(
          (s) => s.key.toUpperCase() === legacyStatus,
        ) ||
        defaultWorkflow.statuses.find(
          (s) => s.category === StatusCategory.INITIAL,
        ) ||
        defaultWorkflow.statuses[0];

      await deps.ticketsRepo.backfillTicket(
        ticket._id,
        org._id,
        defaultWorkflow._id,
        matchingStatus.key,
        matchingStatus.category,
      );

      orgTicketsBackfilled++;
      totalTicketsBackfilled++;
    }

    if (orgTicketsBackfilled > 0) {
      logger.log(
        `Backfilled ${orgTicketsBackfilled} ticket(s) for organization "${org.name}" (${org._id})`,
      );
    }
  }

  logger.log(
    `Backfill finished: ${orgs.length} org(s) processed, ${workflowsCreated} workflow(s) created, ${totalTicketsBackfilled} ticket(s) backfilled.`,
  );

  return {
    orgsProcessed: orgs.length,
    workflowsCreated,
    ticketsBackfilled: totalTicketsBackfilled,
  };
}

export async function backfillWorkflows(
  app: INestApplicationContext,
  logger: Logger = new Logger('BackfillWorkflows'),
) {
  const orgsRepo = app.get(OrganizationsRepository);
  const workflowsRepo = app.get(WorkflowsRepository);
  const workflowsService = app.get(WorkflowsService);
  const ticketsRepo = app.get(TicketsRepository);

  return executeBackfill(
    {
      orgsRepo,
      workflowsRepo,
      workflowsService,
      ticketsRepo,
    },
    logger,
  );
}

async function bootstrap() {
  const logger = new Logger('BackfillWorkflows');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    await backfillWorkflows(app, logger);
    await app.close();
  } catch (error) {
    logger.error('Failed to run workflow backfill:', error);
    await app.close();
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test' && require.main === module) {
  bootstrap();
}

