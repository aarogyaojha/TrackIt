import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import {
  HEALTH_CHECK_ERROR_DESCRIPTION,
  HEALTH_CHECK_OK_DESCRIPTION,
  HEALTH_CHECK_SUMMARY,
  HEALTH_TAG,
} from './health.constants';

@Public()
@SkipThrottle({ default: true, auth: true })
@ApiTags(HEALTH_TAG)
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongooseHealth: MongooseHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: HEALTH_CHECK_SUMMARY })
  @ApiOkResponse({ description: HEALTH_CHECK_OK_DESCRIPTION })
  @ApiResponse({
    status: 503,
    description: HEALTH_CHECK_ERROR_DESCRIPTION,
  })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.mongooseHealth.pingCheck('database'),
    ]);
  }
}
