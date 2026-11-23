import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ApiStandardErrors } from '../../common/decorators/api-standard-errors.decorator';
import {
  PUBLIC_THROTTLE_LIMIT,
  PUBLIC_THROTTLE_TTL_MS,
} from '../../common/throttle/throttle.constants';
import { ErrorCode } from '../../constants';
import { Public } from '../auth/decorators/public.decorator';
import { PublicCreateTicketDto } from './dto/public-create-ticket.dto';
import { TICKETS_SWAGGER } from './ticket.constants';
import { toPublicTicketResponse } from './ticket.response';
import { TicketsService } from './ticket.service';

@ApiTags(TICKETS_SWAGGER.PUBLIC_TAG)
@Public()
@Controller('public')
export class PublicTicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get(':orgSlug/info')
  @Throttle({
    public: {
      limit: PUBLIC_THROTTLE_LIMIT,
      ttl: PUBLIC_THROTTLE_TTL_MS,
    },
  })
  @ApiOperation({
    summary: TICKETS_SWAGGER.GET_PUBLIC_INFO_SUMMARY,
    description: TICKETS_SWAGGER.GET_PUBLIC_INFO_DESCRIPTION,
  })
  @ApiOkResponse({
    description: TICKETS_SWAGGER.GET_PUBLIC_INFO_OK_DESCRIPTION,
  })
  @ApiStandardErrors(ErrorCode.NOT_FOUND)
  async getPublicOrgInfo(@Param('orgSlug') orgSlug: string) {
    return this.ticketsService.getPublicOrgInfo(orgSlug);
  }

  @Get(':orgSlug/lookup')
  @Throttle({
    public: {
      limit: PUBLIC_THROTTLE_LIMIT,
      ttl: PUBLIC_THROTTLE_TTL_MS,
    },
  })
  @ApiOperation({
    summary: TICKETS_SWAGGER.LOOKUP_PUBLIC_SUMMARY,
    description: TICKETS_SWAGGER.LOOKUP_PUBLIC_DESCRIPTION,
  })
  @ApiOkResponse({
    description: TICKETS_SWAGGER.LOOKUP_PUBLIC_OK_DESCRIPTION,
  })
  @ApiStandardErrors(ErrorCode.NOT_FOUND)
  async lookupPublic(
    @Param('orgSlug') orgSlug: string,
    @Query('query') query: string,
  ) {
    const { tickets } = await this.ticketsService.lookupPublic(orgSlug, query);
    return tickets.map((t) =>
      toPublicTicketResponse(t.ticket, t.orgName, t.workflow),
    );
  }

  @Get(':orgSlug/intake')
  @Throttle({
    public: {
      limit: PUBLIC_THROTTLE_LIMIT,
      ttl: PUBLIC_THROTTLE_TTL_MS,
    },
  })
  @ApiOperation({
    summary: TICKETS_SWAGGER.GET_PUBLIC_INTAKE_SUMMARY,
    description: TICKETS_SWAGGER.GET_PUBLIC_INTAKE_DESCRIPTION,
  })
  @ApiOkResponse({
    description: TICKETS_SWAGGER.GET_PUBLIC_INTAKE_OK_DESCRIPTION,
  })
  @ApiStandardErrors(ErrorCode.NOT_FOUND)
  async getPublicIntake(@Param('orgSlug') orgSlug: string) {
    return this.ticketsService.getPublicIntakeInfo(orgSlug);
  }

  @Post(':orgSlug/tickets')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({
    public: {
      limit: PUBLIC_THROTTLE_LIMIT,
      ttl: PUBLIC_THROTTLE_TTL_MS,
    },
  })
  @ApiOperation({
    summary: TICKETS_SWAGGER.CREATE_PUBLIC_SUMMARY,
    description: TICKETS_SWAGGER.CREATE_PUBLIC_DESCRIPTION,
  })
  @ApiCreatedResponse({
    description: TICKETS_SWAGGER.CREATE_PUBLIC_CREATED_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.NOT_FOUND,
    ErrorCode.PLAN_LIMIT_EXCEEDED,
  )
  async createPublicTicket(
    @Param('orgSlug') orgSlug: string,
    @Body() dto: PublicCreateTicketDto,
  ) {
    const { ticket, orgName, workflow } =
      await this.ticketsService.createPublicTicket(orgSlug, dto);

    return toPublicTicketResponse(ticket, orgName, workflow);
  }

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
    const { ticket, orgName, workflow } =
      await this.ticketsService.getPublicByOrgSlugAndCode(orgSlug, code);

    return toPublicTicketResponse(ticket, orgName, workflow);
  }
}

