import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateStaffUserDto {
  @ApiPropertyOptional({
    description: 'Full name of the staff member',
    example: 'John Doe Senior',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Role key assigned to the staff member',
    example: 'ORG_ADMIN',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  role?: string;

  @ApiPropertyOptional({
    description: 'Active status toggle for the staff account',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
