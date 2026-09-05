import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiStandardErrors } from '../../common/decorators/api-standard-errors.decorator';
import { AppException } from '../../common/exceptions/app.exception';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { AppConfigService } from '../../config/app-config.service';
import { ErrorCode, ErrorMessages } from '../../constants';
import { SWAGGER_DEFAULTS } from '../../constants/swagger.constants';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { OrganizationsService } from '../organizations/organization.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { TICKETS_SWAGGER } from './ticket.constants';
import { toTicketResponse } from './ticket.response';
import { TicketsService } from './ticket.service';

@ApiTags(TICKETS_SWAGGER.TAG)
@ApiBearerAuth(SWAGGER_DEFAULTS.AUTH_BEARER_NAME)
@UseGuards(TenantGuard)
@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly organizationsService: OrganizationsService,
    private readonly appConfigService: AppConfigService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: TICKETS_SWAGGER.CREATE_SUMMARY,
    description: TICKETS_SWAGGER.CREATE_DESCRIPTION,
  })
  @ApiCreatedResponse({
    description: TICKETS_SWAGGER.CREATE_CREATED_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.CONFLICT,
  )
  async create(
    @CurrentOrg() orgId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateTicketDto,
  ) {
    const org = await this.organizationsService.getById(orgId);
    if (!org) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        ErrorMessages[ErrorCode.NOT_FOUND],
      );
    }

    const ticket = await this.ticketsService.create(orgId, userId, dto);
    return toTicketResponse(ticket, org.slug, this.appConfigService.corsOrigin);
  }

  @Get()
  @ApiOperation({
    summary: TICKETS_SWAGGER.LIST_SUMMARY,
    description: TICKETS_SWAGGER.LIST_DESCRIPTION,
  })
  @ApiOkResponse({
    description: TICKETS_SWAGGER.LIST_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
  )
  async list(
    @CurrentOrg() orgId: string,
    @Query() query: ListTicketsQueryDto,
  ) {
    const org = await this.organizationsService.getById(orgId);
    if (!org) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        ErrorMessages[ErrorCode.NOT_FOUND],
      );
    }

    const { items, total } = await this.ticketsService.listByOrg(orgId, query);
    const limit = query.limit || 20;
    const page = query.page || 1;
    const totalPages = Math.ceil(total / limit);

    const data = await Promise.all(
      items.map((ticket) =>
        toTicketResponse(ticket, org.slug, this.appConfigService.corsOrigin),
      ),
    );

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: TICKETS_SWAGGER.GET_BY_ID_SUMMARY,
    description: TICKETS_SWAGGER.GET_BY_ID_DESCRIPTION,
  })
  @ApiOkResponse({
    description: TICKETS_SWAGGER.GET_BY_ID_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.NOT_FOUND,
  )
  async getById(
    @CurrentOrg() orgId: string,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    const org = await this.organizationsService.getById(orgId);
    if (!org) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        ErrorMessages[ErrorCode.NOT_FOUND],
      );
    }

    const ticket = await this.ticketsService.getByIdScoped(orgId, id);
    return toTicketResponse(ticket, org.slug, this.appConfigService.corsOrigin);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: TICKETS_SWAGGER.UPDATE_STATUS_SUMMARY,
    description: TICKETS_SWAGGER.UPDATE_STATUS_DESCRIPTION,
  })
  @ApiOkResponse({
    description: TICKETS_SWAGGER.UPDATE_STATUS_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.NOT_FOUND,
    ErrorCode.CONFLICT,
  )
  async updateStatus(
    @CurrentOrg() orgId: string,
    @CurrentUser('userId') userId: string,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    const org = await this.organizationsService.getById(orgId);
    if (!org) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        ErrorMessages[ErrorCode.NOT_FOUND],
      );
    }

    const ticket = await this.ticketsService.updateStatus(
      orgId,
      id,
      userId,
      dto.status,
    );
    return toTicketResponse(ticket, org.slug, this.appConfigService.corsOrigin);
  }
}
