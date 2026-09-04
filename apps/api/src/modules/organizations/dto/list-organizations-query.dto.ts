import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { OrgStatus } from '@trackit/types';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ORGANIZATIONS_SWAGGER } from '../organization.constants';

export class ListOrganizationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: ORGANIZATIONS_SWAGGER.LIST_QUERY_STATUS_DESCRIPTION,
    enum: OrgStatus,
  })
  @IsOptional()
  @IsEnum(OrgStatus)
  status?: OrgStatus;
}
