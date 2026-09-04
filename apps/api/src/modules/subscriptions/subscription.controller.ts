import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiStandardErrors } from '../../common/decorators/api-standard-errors.decorator';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { ErrorCode } from '../../constants';
import { SWAGGER_DEFAULTS } from '../../constants/swagger.constants';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { SuperAdminOnly } from '../auth/decorators/super-admin-only.decorator';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { ChangeSubscriptionTierDto } from './dto/change-subscription-tier.dto';
import { SUBSCRIPTIONS_SWAGGER } from './subscription.constants';
import { toSubscriptionSummaryResponse } from './subscription.response';
import { SubscriptionsService } from './subscription.service';

@ApiTags(SUBSCRIPTIONS_SWAGGER.TAG)
@ApiBearerAuth(SWAGGER_DEFAULTS.AUTH_BEARER_NAME)
@Controller('organizations')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('me/subscription')
  @UseGuards(TenantGuard)
  @ApiOperation({
    summary: SUBSCRIPTIONS_SWAGGER.GET_ME_SUMMARY,
    description: SUBSCRIPTIONS_SWAGGER.GET_ME_DESCRIPTION,
  })
  @ApiOkResponse({
    description: SUBSCRIPTIONS_SWAGGER.GET_ME_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.NOT_FOUND,
  )
  async getMySubscription(@CurrentOrg() orgId: string) {
    const summary = await this.subscriptionsService.getUsageSummary(orgId);
    return toSubscriptionSummaryResponse(summary);
  }

  @Get(':id/subscription')
  @SuperAdminOnly()
  @ApiOperation({
    summary: SUBSCRIPTIONS_SWAGGER.GET_ORG_SUMMARY,
    description: SUBSCRIPTIONS_SWAGGER.GET_ORG_DESCRIPTION,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Organization ID',
  })
  @ApiOkResponse({
    description: SUBSCRIPTIONS_SWAGGER.GET_ORG_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.NOT_FOUND,
  )
  async getOrganizationSubscription(
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    const summary = await this.subscriptionsService.getUsageSummary(id);
    return toSubscriptionSummaryResponse(summary);
  }

  @Patch(':id/subscription')
  @SuperAdminOnly()
  @ApiOperation({
    summary: SUBSCRIPTIONS_SWAGGER.CHANGE_TIER_SUMMARY,
    description: SUBSCRIPTIONS_SWAGGER.CHANGE_TIER_DESCRIPTION,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Organization ID',
  })
  @ApiOkResponse({
    description: SUBSCRIPTIONS_SWAGGER.CHANGE_TIER_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.NOT_FOUND,
  )
  async changeSubscriptionTier(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ChangeSubscriptionTierDto,
  ) {
    await this.subscriptionsService.changeTier(id, dto.planTier);
    const summary = await this.subscriptionsService.getUsageSummary(id);
    return toSubscriptionSummaryResponse(summary);
  }
}
