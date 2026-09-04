import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlansModule } from '../plans/plan.module';
import { UsersModule } from '../users/user.module';
import { SubscriptionsController } from './subscription.controller';
import { SubscriptionCronService } from './subscription.cron';
import { SubscriptionsRepository } from './subscription.repository';
import { Subscription, SubscriptionSchema } from './subscription.schema';
import { SubscriptionsService } from './subscription.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    PlansModule,
    UsersModule,
  ],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsRepository,
    SubscriptionsService,
    SubscriptionCronService,
  ],
  exports: [SubscriptionsRepository, SubscriptionsService],
})
export class SubscriptionsModule {}
