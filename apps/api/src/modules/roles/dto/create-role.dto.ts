import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Permission } from '@trackit/types';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Human-readable name of the role',
    example: 'Shop Technician',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'Unique uppercase identifier key for the role',
    example: 'SHOP_TECHNICIAN',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'Role key must contain only uppercase letters, numbers, and underscores',
  })
  key: string;

  @ApiPropertyOptional({
    description: 'Optional description of the role responsibilities',
    example: 'Handles repairs, updates service stages, and reads tickets',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiProperty({
    description: 'List of granular permissions assigned to this role',
    enum: Permission,
    isArray: true,
    example: [
      Permission.TICKETS_READ,
      Permission.TICKETS_UPDATE_STATUS,
      Permission.WORKFLOWS_READ,
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Permission, { each: true })
  permissions: Permission[];
}
