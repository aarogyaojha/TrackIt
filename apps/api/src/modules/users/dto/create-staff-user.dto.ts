import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateStaffUserDto {
  @ApiProperty({
    description: 'Email address of the staff member',
    example: 'technician@acme.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Password for the staff account (minimum 8 characters)',
    example: 'P@ssword123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Full name of the staff member',
    example: 'John Technician',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Role key assigned to the staff member (e.g. ORG_ADMIN, ORG_STAFF, or a custom role key)',
    example: 'ORG_STAFF',
  })
  @IsString()
  @IsNotEmpty()
  role: string;
}
