import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import {
  AUTH_THROTTLE_LIMIT,
  AUTH_THROTTLE_TTL_MS,
  DEFAULT_THROTTLE_LIMIT,
  DEFAULT_THROTTLE_TTL_MS,
  PUBLIC_THROTTLE_LIMIT,
  PUBLIC_THROTTLE_TTL_MS,
} from './common/throttle/throttle.constants';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { HealthModule } from './modules/health/health.module';
import { OrganizationsModule } from './modules/organizations/organization.module';
import { PlansModule } from './modules/plans/plan.module';
import { PlatformSettingsModule } from './modules/platform-settings/platform-settings.module';
import { SubscriptionsModule } from './modules/subscriptions/subscription.module';
import { TicketsModule } from './modules/tickets/ticket.module';
import { UsersModule } from './modules/users/user.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: DEFAULT_THROTTLE_TTL_MS,
        limit: DEFAULT_THROTTLE_LIMIT,
      },
      {
        name: 'auth',
        ttl: AUTH_THROTTLE_TTL_MS,
        limit: AUTH_THROTTLE_LIMIT,
      },
      {
        name: 'public',
        ttl: PUBLIC_THROTTLE_TTL_MS,
        limit: PUBLIC_THROTTLE_LIMIT,
      },
    ]),
    ScheduleModule.forRoot(),
    AppConfigModule,
    DatabaseModule,
    UsersModule,
    PlatformSettingsModule,
    PlansModule,
    SubscriptionsModule,
    OrganizationsModule,
    TicketsModule,
    AuthModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
