import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PlanTier } from '@trackit/types';
import { ApiStandardErrors } from '../../common/decorators/api-standard-errors.decorator';
import { ErrorCode } from '../../constants';
import { SWAGGER_DEFAULTS } from '../../constants/swagger.constants';
import { SuperAdminOnly } from '../auth/decorators/super-admin-only.decorator';
import { UpdatePlanLimitsDto } from './dto/update-plan-limits.dto';
import { PLANS_SWAGGER } from './plan.constants';
import { toPlanResponse } from './plan.response';
import { PlansService } from './plan.service';

@ApiTags(PLANS_SWAGGER.TAG)
@ApiBearerAuth(SWAGGER_DEFAULTS.AUTH_BEARER_NAME)
@SuperAdminOnly()
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({
    summary: PLANS_SWAGGER.LIST_SUMMARY,
    description: PLANS_SWAGGER.LIST_DESCRIPTION,
  })
  @ApiOkResponse({
    description: PLANS_SWAGGER.LIST_OK_DESCRIPTION,
  })
  @ApiStandardErrors(ErrorCode.UNAUTHORIZED, ErrorCode.FORBIDDEN)
  async listAll() {
    const plans = await this.plansService.listAll();
    return plans.map((plan) => toPlanResponse(plan));
  }

  @Patch(':tier')
  @ApiOperation({
    summary: PLANS_SWAGGER.UPDATE_SUMMARY,
    description: PLANS_SWAGGER.UPDATE_DESCRIPTION,
  })
  @ApiParam({
    name: 'tier',
    enum: PlanTier,
    description: 'Plan tier to update',
  })
  @ApiOkResponse({
    description: PLANS_SWAGGER.UPDATE_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
  )
  async updateLimits(
    @Param('tier', new ParseEnumPipe(PlanTier)) tier: PlanTier,
    @Body() dto: UpdatePlanLimitsDto,
  ) {
    const plan = await this.plansService.updateLimits(tier, dto);
    return toPlanResponse(plan);
  }
}
