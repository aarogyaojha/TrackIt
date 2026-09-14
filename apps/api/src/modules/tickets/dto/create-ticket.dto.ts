import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  MAX_CUSTOMER_NAME_LENGTH,
  MAX_ITEM_DESCRIPTION_LENGTH,
  MIN_CUSTOMER_NAME_LENGTH,
  PHONE_NUMBER_PATTERN,
  PHONE_NUMBER_PATTERN_MESSAGE,
  TICKETS_DTO_SWAGGER,
} from '../ticket.constants';

export class CreateTicketDto {
  @ApiProperty({
    description: TICKETS_DTO_SWAGGER.CODE_DESCRIPTION,
    example: TICKETS_DTO_SWAGGER.CODE_EXAMPLE,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  code: string;

  @ApiProperty({
    description: TICKETS_DTO_SWAGGER.CUSTOMER_NAME_DESCRIPTION,
    example: TICKETS_DTO_SWAGGER.CUSTOMER_NAME_EXAMPLE,
    minLength: MIN_CUSTOMER_NAME_LENGTH,
    maxLength: MAX_CUSTOMER_NAME_LENGTH,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @Length(MIN_CUSTOMER_NAME_LENGTH, MAX_CUSTOMER_NAME_LENGTH)
  customerName: string;

  @ApiProperty({
    description: TICKETS_DTO_SWAGGER.CUSTOMER_PHONE_DESCRIPTION,
    example: TICKETS_DTO_SWAGGER.CUSTOMER_PHONE_EXAMPLE,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @Matches(PHONE_NUMBER_PATTERN, { message: PHONE_NUMBER_PATTERN_MESSAGE })
  customerPhone: string;

  @ApiProperty({
    description: TICKETS_DTO_SWAGGER.ITEM_DESCRIPTION_DESCRIPTION,
    example: TICKETS_DTO_SWAGGER.ITEM_DESCRIPTION_EXAMPLE,
    maxLength: MAX_ITEM_DESCRIPTION_LENGTH,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @MaxLength(MAX_ITEM_DESCRIPTION_LENGTH)
  itemDescription: string;
}
