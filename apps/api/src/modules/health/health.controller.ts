import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  MongooseHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongooseHealth: MongooseHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiOkResponse({ description: 'Health check passed' })
  @ApiResponse({
    status: 503,
    description: 'One or more health indicators are down',
  })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.mongooseHealth.pingCheck('database'),
    ]);
  }
}
