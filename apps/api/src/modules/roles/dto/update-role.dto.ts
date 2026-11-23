import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Permission } from '@trackit/types';

export class UpdateRoleDto {
  @ApiPropertyOptional({
    description: 'Human-readable name of the role',
    example: 'Senior Technician',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({
    description: 'Optional description of the role responsibilities',
    example: 'Supervises repairs and updates stages',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({
    description: 'List of granular permissions assigned to this role',
    enum: Permission,
    isArray: true,
    example: [
      Permission.TICKETS_READ,
      Permission.TICKETS_UPDATE,
      Permission.TICKETS_UPDATE_STATUS,
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsOptional()
  @IsEnum(Permission, { each: true })
  permissions?: Permission[];
}
