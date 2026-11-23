import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { TICKETS_DTO_SWAGGER } from '../ticket.constants';

export class ListTicketsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: TICKETS_DTO_SWAGGER.STATUS_QUERY_DESCRIPTION,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter tickets by associated workflow ID',
  })
  @IsOptional()
  @IsMongoId()
  workflowId?: string;

  @ApiPropertyOptional({
    description: TICKETS_DTO_SWAGGER.SEARCH_QUERY_DESCRIPTION,
  })
  @IsOptional()
  @IsString()
  search?: string;
}

