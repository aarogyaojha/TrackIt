import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionsModule } from '../subscriptions/subscription.module';
import { TicketsModule } from '../tickets/ticket.module';
import { WorkflowsController } from './workflow.controller';
import { WorkflowsRepository } from './workflow.repository';
import { Workflow, WorkflowSchema } from './workflow.schema';
import { WorkflowsService } from './workflow.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workflow.name, schema: WorkflowSchema },
    ]),
    forwardRef(() => TicketsModule),
    forwardRef(() => SubscriptionsModule),
  ],
  controllers: [WorkflowsController],
  providers: [WorkflowsRepository, WorkflowsService],
  exports: [WorkflowsRepository, WorkflowsService],
})
export class WorkflowsModule {}

