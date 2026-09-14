import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  MAX_ADMIN_NAME_LENGTH,
  MAX_ORG_NAME_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_ADMIN_NAME_LENGTH,
  MIN_ORG_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  PASSWORD_PATTERN,
  PASSWORD_PATTERN_MESSAGE,
  REGISTER_ORG_DTO_SWAGGER,
} from '../organization.constants';

export class RegisterOrganizationDto {
  @ApiProperty({
    example: REGISTER_ORG_DTO_SWAGGER.ORG_NAME_EXAMPLE,
    description: REGISTER_ORG_DTO_SWAGGER.ORG_NAME_DESCRIPTION,
    minLength: MIN_ORG_NAME_LENGTH,
    maxLength: MAX_ORG_NAME_LENGTH,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @Length(MIN_ORG_NAME_LENGTH, MAX_ORG_NAME_LENGTH)
  orgName: string;

  @ApiProperty({
    example: REGISTER_ORG_DTO_SWAGGER.ADMIN_NAME_EXAMPLE,
    description: REGISTER_ORG_DTO_SWAGGER.ADMIN_NAME_DESCRIPTION,
    minLength: MIN_ADMIN_NAME_LENGTH,
    maxLength: MAX_ADMIN_NAME_LENGTH,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @Length(MIN_ADMIN_NAME_LENGTH, MAX_ADMIN_NAME_LENGTH)
  adminName: string;

  @ApiProperty({
    example: REGISTER_ORG_DTO_SWAGGER.ADMIN_EMAIL_EXAMPLE,
    description: REGISTER_ORG_DTO_SWAGGER.ADMIN_EMAIL_DESCRIPTION,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @ApiProperty({
    example: REGISTER_ORG_DTO_SWAGGER.ADMIN_PASSWORD_EXAMPLE,
    description: REGISTER_ORG_DTO_SWAGGER.ADMIN_PASSWORD_DESCRIPTION,
    minLength: MIN_PASSWORD_LENGTH,
    maxLength: MAX_PASSWORD_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(MIN_PASSWORD_LENGTH)
  @MaxLength(MAX_PASSWORD_LENGTH)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_PATTERN_MESSAGE })
  adminPassword: string;
}
