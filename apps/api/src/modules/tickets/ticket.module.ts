import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationsModule } from '../organizations/organization.module';
import { SubscriptionsModule } from '../subscriptions/subscription.module';
import { WorkflowsModule } from '../workflows/workflow.module';
import { PublicTicketsController } from './public-ticket.controller';
import { TicketsController } from './ticket.controller';
import { TicketsRepository } from './ticket.repository';
import { Ticket, TicketSchema } from './ticket.schema';
import { TicketsService } from './ticket.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ticket.name, schema: TicketSchema }]),
    forwardRef(() => OrganizationsModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => WorkflowsModule),
  ],
  controllers: [TicketsController, PublicTicketsController],
  providers: [TicketsRepository, TicketsService],
  exports: [TicketsRepository, TicketsService],
})
export class TicketsModule {}

