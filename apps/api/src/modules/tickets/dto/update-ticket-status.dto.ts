import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { TICKETS_DTO_SWAGGER } from '../ticket.constants';

export class UpdateTicketStatusDto {
  @ApiProperty({
    description: TICKETS_DTO_SWAGGER.STATUS_DESCRIPTION,
    example: TICKETS_DTO_SWAGGER.STATUS_EXAMPLE,
  })
  @IsString()
  @IsNotEmpty()
  status: string;
}

