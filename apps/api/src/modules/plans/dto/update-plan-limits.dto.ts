import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { PLANS_DTO_SWAGGER } from '../plan.constants';

export class UpdatePlanLimitsDto {
  @ApiPropertyOptional({
    description: PLANS_DTO_SWAGGER.MAX_ACTIVE_TICKETS_DESCRIPTION,
    example: PLANS_DTO_SWAGGER.MAX_ACTIVE_TICKETS_EXAMPLE,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxActiveTickets?: number;

  @ApiPropertyOptional({
    description: PLANS_DTO_SWAGGER.MAX_STAFF_USERS_DESCRIPTION,
    example: PLANS_DTO_SWAGGER.MAX_STAFF_USERS_EXAMPLE,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxStaffUsers?: number;

  @ApiPropertyOptional({
    description: PLANS_DTO_SWAGGER.MAX_TICKETS_PER_MONTH_DESCRIPTION,
    example: PLANS_DTO_SWAGGER.MAX_TICKETS_PER_MONTH_EXAMPLE,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxTicketsPerMonth?: number;
}
