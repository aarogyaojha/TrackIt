import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { TICKETS_DTO_SWAGGER } from '../ticket.constants';

export class ListTicketsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: TICKETS_DTO_SWAGGER.STATUS_QUERY_DESCRIPTION,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
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
  @MaxLength(100)
  search?: string;
}

