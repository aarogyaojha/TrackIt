import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionsService } from './subscription.service';

@Injectable()
export class SubscriptionCronService {
  private readonly logger = new Logger(SubscriptionCronService.name);

  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleMonthlyReset(): Promise<void> {
    this.logger.log('Starting scheduled monthly subscription usage counter reset');
    const result = await this.subscriptionsService.resetMonthlyUsageCounters();
    this.logger.log(
      `Completed scheduled monthly reset: ${result.modifiedCount} subscription(s) updated`,
    );
  }
}
