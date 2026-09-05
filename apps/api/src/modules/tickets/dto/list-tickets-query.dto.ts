import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TicketStatus } from '@trackit/types';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { TICKETS_DTO_SWAGGER } from '../ticket.constants';

export class ListTicketsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: TICKETS_DTO_SWAGGER.STATUS_QUERY_DESCRIPTION,
    enum: TicketStatus,
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({
    description: TICKETS_DTO_SWAGGER.SEARCH_QUERY_DESCRIPTION,
  })
  @IsOptional()
  @IsString()
  search?: string;
}
