import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { TICKETS_DTO_SWAGGER } from '../ticket.constants';

export class LookupPublicQueryDto {
  @ApiProperty({
    description: TICKETS_DTO_SWAGGER.LOOKUP_QUERY_DESCRIPTION,
    example: TICKETS_DTO_SWAGGER.CODE_EXAMPLE,
    maxLength: 100,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  query: string;
}
