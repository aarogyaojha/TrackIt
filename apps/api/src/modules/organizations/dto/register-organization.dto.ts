import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import {
  MIN_PASSWORD_LENGTH,
  REGISTER_ORG_DTO_SWAGGER,
} from '../organization.constants';

export class RegisterOrganizationDto {
  @ApiProperty({
    example: REGISTER_ORG_DTO_SWAGGER.ORG_NAME_EXAMPLE,
    description: REGISTER_ORG_DTO_SWAGGER.ORG_NAME_DESCRIPTION,
  })
  @IsString()
  @IsNotEmpty()
  orgName: string;

  @ApiProperty({
    example: REGISTER_ORG_DTO_SWAGGER.ADMIN_NAME_EXAMPLE,
    description: REGISTER_ORG_DTO_SWAGGER.ADMIN_NAME_DESCRIPTION,
  })
  @IsString()
  @IsNotEmpty()
  adminName: string;

  @ApiProperty({
    example: REGISTER_ORG_DTO_SWAGGER.ADMIN_EMAIL_EXAMPLE,
    description: REGISTER_ORG_DTO_SWAGGER.ADMIN_EMAIL_DESCRIPTION,
  })
  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @ApiProperty({
    example: REGISTER_ORG_DTO_SWAGGER.ADMIN_PASSWORD_EXAMPLE,
    description: REGISTER_ORG_DTO_SWAGGER.ADMIN_PASSWORD_DESCRIPTION,
    minLength: MIN_PASSWORD_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(MIN_PASSWORD_LENGTH)
  adminPassword: string;
}
