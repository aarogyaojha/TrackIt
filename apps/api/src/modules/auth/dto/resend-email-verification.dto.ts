import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { RESEND_EMAIL_VERIFICATION_DTO_SWAGGER } from '../auth.constants';

export class ResendEmailVerificationDto {
  @ApiProperty({
    example: RESEND_EMAIL_VERIFICATION_DTO_SWAGGER.EMAIL_EXAMPLE,
    description: RESEND_EMAIL_VERIFICATION_DTO_SWAGGER.EMAIL_DESCRIPTION,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
