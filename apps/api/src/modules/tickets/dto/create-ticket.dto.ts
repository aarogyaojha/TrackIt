import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';
import { TICKETS_DTO_SWAGGER } from '../ticket.constants';

export class CreateTicketDto {
  @ApiProperty({
    description: TICKETS_DTO_SWAGGER.CODE_DESCRIPTION,
    example: TICKETS_DTO_SWAGGER.CODE_EXAMPLE,
  })
  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  code: string;

  @ApiProperty({
    description: TICKETS_DTO_SWAGGER.CUSTOMER_NAME_DESCRIPTION,
    example: TICKETS_DTO_SWAGGER.CUSTOMER_NAME_EXAMPLE,
  })
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @ApiProperty({
    description: TICKETS_DTO_SWAGGER.CUSTOMER_PHONE_DESCRIPTION,
    example: TICKETS_DTO_SWAGGER.CUSTOMER_PHONE_EXAMPLE,
  })
  @IsNotEmpty()
  @IsString()
  customerPhone: string;

  @ApiProperty({
    description: TICKETS_DTO_SWAGGER.ITEM_DESCRIPTION_DESCRIPTION,
    example: TICKETS_DTO_SWAGGER.ITEM_DESCRIPTION_EXAMPLE,
  })
  @IsNotEmpty()
  @IsString()
  itemDescription: string;
}
