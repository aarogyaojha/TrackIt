import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  MAX_WORKFLOW_DESCRIPTION_LENGTH,
  MAX_WORKFLOW_NAME_LENGTH,
  MAX_WORKFLOW_STATUSES,
  MIN_WORKFLOW_NAME_LENGTH,
} from '../workflow.constants';
import { WorkflowStatusDto } from './workflow-status.dto';

export class CreateWorkflowDto {
  @ApiProperty({
    description: 'Human-readable name of the workflow',
    example: 'Auto Repair Service',
    minLength: MIN_WORKFLOW_NAME_LENGTH,
    maxLength: MAX_WORKFLOW_NAME_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(MIN_WORKFLOW_NAME_LENGTH)
  @MaxLength(MAX_WORKFLOW_NAME_LENGTH)
  name: string;

  @ApiPropertyOptional({
    description: 'Optional description of what tickets use this workflow',
    example: 'Standard workflow for motorcycle and car servicing',
    maxLength: MAX_WORKFLOW_DESCRIPTION_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_WORKFLOW_DESCRIPTION_LENGTH)
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether this workflow is the default choice for new tickets',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({
    description: 'Ordered list of status steps in this workflow',
    type: [WorkflowStatusDto],
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(MAX_WORKFLOW_STATUSES)
  @ValidateNested({ each: true })
  @Type(() => WorkflowStatusDto)
  statuses: WorkflowStatusDto[];
}

