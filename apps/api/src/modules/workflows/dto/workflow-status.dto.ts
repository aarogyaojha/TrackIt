import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { StatusCategory } from '@trackit/types';
import {
  MAX_STATUS_KEY_LENGTH,
  MAX_STATUS_NAME_LENGTH,
  MIN_STATUS_KEY_LENGTH,
  MIN_STATUS_NAME_LENGTH,
  STATUS_KEY_REGEX,
} from '../workflow.constants';

export class WorkflowStatusDto {
  @ApiProperty({
    description: 'Unique status key/slug within the workflow',
    example: 'diagnostics',
    minLength: MIN_STATUS_KEY_LENGTH,
    maxLength: MAX_STATUS_KEY_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(MIN_STATUS_KEY_LENGTH)
  @MaxLength(MAX_STATUS_KEY_LENGTH)
  @Matches(STATUS_KEY_REGEX, {
    message: 'Key must only contain lowercase letters, numbers, hyphens, and underscores',
  })
  key: string;

  @ApiProperty({
    description: 'Internal staff-facing name for this status',
    example: 'Under Diagnostics',
    minLength: MIN_STATUS_NAME_LENGTH,
    maxLength: MAX_STATUS_NAME_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(MIN_STATUS_NAME_LENGTH)
  @MaxLength(MAX_STATUS_NAME_LENGTH)
  name: string;

  @ApiPropertyOptional({
    description: 'Customer-facing label shown on the public tracking page',
    example: 'Under Diagnostics',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_STATUS_NAME_LENGTH)
  customerLabel?: string;

  @ApiPropertyOptional({
    description: 'Customer-facing description explaining what this stage means',
    example: 'Our technicians are inspecting and diagnosing the issue.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  customerDescription?: string;

  @ApiProperty({
    description: 'Category determining lifecycle behavior and plan limits',
    enum: StatusCategory,
    example: StatusCategory.IN_PROGRESS,
  })
  @IsEnum(StatusCategory)
  category: StatusCategory;

  @ApiPropertyOptional({
    description: 'Visual badge color or semantic variant token',
    example: 'warning',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    description: 'Zero-based sequential order of the status in the workflow',
    example: 1,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  order: number;
}

