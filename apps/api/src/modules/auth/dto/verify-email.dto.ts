import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { OTP_LENGTH, VERIFY_EMAIL_DTO_SWAGGER } from '../auth.constants';

export class VerifyEmailDto {
  @ApiProperty({
    example: VERIFY_EMAIL_DTO_SWAGGER.EMAIL_EXAMPLE,
    description: VERIFY_EMAIL_DTO_SWAGGER.EMAIL_DESCRIPTION,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: VERIFY_EMAIL_DTO_SWAGGER.OTP_EXAMPLE,
    description: VERIFY_EMAIL_DTO_SWAGGER.OTP_DESCRIPTION,
  })
  @IsString()
  @IsNotEmpty()
  @Length(OTP_LENGTH, OTP_LENGTH)
  otp: string;
}
