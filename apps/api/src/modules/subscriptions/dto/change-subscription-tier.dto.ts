import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PlanTier } from '@trackit/types';
import { SUBSCRIPTION_DTO_SWAGGER } from '../subscription.constants';

export class ChangeSubscriptionTierDto {
  @ApiProperty({
    enum: PlanTier,
    description: SUBSCRIPTION_DTO_SWAGGER.PLAN_TIER_DESCRIPTION,
    example: SUBSCRIPTION_DTO_SWAGGER.PLAN_TIER_EXAMPLE,
  })
  @IsEnum(PlanTier)
  planTier: PlanTier;
}
