import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { LOGIN_DTO_SWAGGER } from '../auth.constants';

export class LoginDto {
  @ApiProperty({
    example: LOGIN_DTO_SWAGGER.EMAIL_EXAMPLE,
    description: LOGIN_DTO_SWAGGER.EMAIL_DESCRIPTION,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: LOGIN_DTO_SWAGGER.PASSWORD_EXAMPLE,
    description: LOGIN_DTO_SWAGGER.PASSWORD_DESCRIPTION,
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
