import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlansController } from './plan.controller';
import { PlansRepository } from './plan.repository';
import { Plan, PlanSchema } from './plan.schema';
import { PlansService } from './plan.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Plan.name, schema: PlanSchema }]),
  ],
  controllers: [PlansController],
  providers: [PlansRepository, PlansService],
  exports: [PlansRepository, PlansService],
})
export class PlansModule {}
