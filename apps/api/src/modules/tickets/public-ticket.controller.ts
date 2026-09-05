import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ApiStandardErrors } from '../../common/decorators/api-standard-errors.decorator';
import {
  PUBLIC_THROTTLE_LIMIT,
  PUBLIC_THROTTLE_TTL_MS,
} from '../../common/throttle/throttle.constants';
import { ErrorCode } from '../../constants';
import { Public } from '../auth/decorators/public.decorator';
import { TICKETS_SWAGGER } from './ticket.constants';
import { toPublicTicketResponse } from './ticket.response';
import { TicketsService } from './ticket.service';

@ApiTags(TICKETS_SWAGGER.PUBLIC_TAG)
@Public()
@Controller('public')
export class PublicTicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get(':orgSlug/tickets/:code')
  @Throttle({
    public: {
      limit: PUBLIC_THROTTLE_LIMIT,
      ttl: PUBLIC_THROTTLE_TTL_MS,
    },
  })
  @ApiOperation({
    summary: TICKETS_SWAGGER.GET_PUBLIC_SUMMARY,
    description: TICKETS_SWAGGER.GET_PUBLIC_DESCRIPTION,
  })
  @ApiOkResponse({
    description: TICKETS_SWAGGER.GET_PUBLIC_OK_DESCRIPTION,
  })
  @ApiStandardErrors(ErrorCode.NOT_FOUND)
  async getPublicTicket(
    @Param('orgSlug') orgSlug: string,
    @Param('code') code: string,
  ) {
    const { ticket, orgName } =
      await this.ticketsService.getPublicByOrgSlugAndCode(orgSlug, code);

    return toPublicTicketResponse(ticket, orgName);
  }
}
