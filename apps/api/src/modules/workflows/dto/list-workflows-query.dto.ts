import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsOptional } from 'class-validator';

export class ListWorkflowsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter only active workflows',
    type: Boolean,
  })
  @IsOptional()
  @IsBooleanString()
  activeOnly?: string;
}
