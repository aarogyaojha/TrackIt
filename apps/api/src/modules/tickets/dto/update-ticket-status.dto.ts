import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TicketStatus } from '@trackit/types';
import { TICKETS_DTO_SWAGGER } from '../ticket.constants';

export class UpdateTicketStatusDto {
  @ApiProperty({
    description: TICKETS_DTO_SWAGGER.STATUS_DESCRIPTION,
    enum: TicketStatus,
    example: TICKETS_DTO_SWAGGER.STATUS_EXAMPLE,
  })
  @IsEnum(TicketStatus)
  status: TicketStatus;
}
