import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { Throttle } from '@nestjs/throttler';
import { ApiStandardErrors } from '../../common/decorators/api-standard-errors.decorator';
import { AppException } from '../../common/exceptions/app.exception';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import {
  AUTH_THROTTLE_LIMIT,
  AUTH_THROTTLE_TTL_MS,
} from '../../common/throttle/throttle.constants';
import { ErrorCode, ErrorMessages } from '../../constants';
import { SWAGGER_DEFAULTS } from '../../constants/swagger.constants';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { SuperAdminOnly } from '../auth/decorators/super-admin-only.decorator';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { ListOrganizationsQueryDto } from './dto/list-organizations-query.dto';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { ORGANIZATIONS_SWAGGER } from './organization.constants';
import { toOrganizationResponse } from './organization.response';
import { OrganizationsService } from './organization.service';

@ApiTags(ORGANIZATIONS_SWAGGER.TAG)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Public()
  @Throttle({
    auth: {
      limit: AUTH_THROTTLE_LIMIT,
      ttl: AUTH_THROTTLE_TTL_MS,
    },
  })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: ORGANIZATIONS_SWAGGER.REGISTER_SUMMARY,
    description: ORGANIZATIONS_SWAGGER.REGISTER_DESCRIPTION,
  })
  @ApiCreatedResponse({
    description: ORGANIZATIONS_SWAGGER.REGISTER_CREATED_DESCRIPTION,
  })
  @ApiStandardErrors(ErrorCode.VALIDATION_ERROR, ErrorCode.CONFLICT)
  async register(@Body() dto: RegisterOrganizationDto) {
    const result = await this.organizationsService.registerOrganization(dto);
    return {
      organization: toOrganizationResponse(result.organization),
    };
  }


  @Get('me')
  @UseGuards(TenantGuard)
  @ApiBearerAuth(SWAGGER_DEFAULTS.AUTH_BEARER_NAME)
  @ApiOperation({
    summary: ORGANIZATIONS_SWAGGER.GET_ME_SUMMARY,
    description: ORGANIZATIONS_SWAGGER.GET_ME_DESCRIPTION,
  })
  @ApiOkResponse({
    description: ORGANIZATIONS_SWAGGER.GET_ME_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.NOT_FOUND,
  )
  async getMe(@CurrentOrg() orgId: string) {
    const org = await this.organizationsService.getById(orgId);
    if (!org) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        ErrorMessages[ErrorCode.NOT_FOUND],
      );
    }

    return toOrganizationResponse(org);
  }

  @Get()
  @SuperAdminOnly()
  @ApiBearerAuth(SWAGGER_DEFAULTS.AUTH_BEARER_NAME)
  @ApiOperation({
    summary: ORGANIZATIONS_SWAGGER.LIST_SUMMARY,
    description: ORGANIZATIONS_SWAGGER.LIST_DESCRIPTION,
  })
  @ApiOkResponse({
    description: ORGANIZATIONS_SWAGGER.LIST_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
  )
  async list(@Query() query: ListOrganizationsQueryDto) {
    const { items, total } = await this.organizationsService.listOrganizations(
      query,
      query.status,
    );
    const limit = query.limit || 20;
    const page = query.page || 1;
    const totalPages = Math.ceil(total / limit);

    return {
      data: items.map((org) => toOrganizationResponse(org)),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  @Get(':id')
  @SuperAdminOnly()
  @ApiBearerAuth(SWAGGER_DEFAULTS.AUTH_BEARER_NAME)
  @ApiOperation({
    summary: ORGANIZATIONS_SWAGGER.GET_BY_ID_SUMMARY,
    description: ORGANIZATIONS_SWAGGER.GET_BY_ID_DESCRIPTION,
  })
  @ApiOkResponse({
    description: ORGANIZATIONS_SWAGGER.GET_BY_ID_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.NOT_FOUND,
  )
  async getById(@Param('id', ParseObjectIdPipe) id: string) {
    const org = await this.organizationsService.getByIdForSuperadmin(id);
    return toOrganizationResponse(org);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @SuperAdminOnly()
  @ApiBearerAuth(SWAGGER_DEFAULTS.AUTH_BEARER_NAME)
  @ApiOperation({
    summary: ORGANIZATIONS_SWAGGER.APPROVE_SUMMARY,
    description: ORGANIZATIONS_SWAGGER.APPROVE_DESCRIPTION,
  })
  @ApiOkResponse({
    description: ORGANIZATIONS_SWAGGER.APPROVE_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.NOT_FOUND,
    ErrorCode.CONFLICT,
  )
  async approve(@Param('id', ParseObjectIdPipe) id: string) {
    const org = await this.organizationsService.approve(id);
    return toOrganizationResponse(org);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @SuperAdminOnly()
  @ApiBearerAuth(SWAGGER_DEFAULTS.AUTH_BEARER_NAME)
  @ApiOperation({
    summary: ORGANIZATIONS_SWAGGER.REJECT_SUMMARY,
    description: ORGANIZATIONS_SWAGGER.REJECT_DESCRIPTION,
  })
  @ApiOkResponse({
    description: ORGANIZATIONS_SWAGGER.REJECT_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.NOT_FOUND,
    ErrorCode.CONFLICT,
  )
  async reject(@Param('id', ParseObjectIdPipe) id: string) {
    const org = await this.organizationsService.reject(id);
    return toOrganizationResponse(org);
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @SuperAdminOnly()
  @ApiBearerAuth(SWAGGER_DEFAULTS.AUTH_BEARER_NAME)
  @ApiOperation({
    summary: ORGANIZATIONS_SWAGGER.SUSPEND_SUMMARY,
    description: ORGANIZATIONS_SWAGGER.SUSPEND_DESCRIPTION,
  })
  @ApiOkResponse({
    description: ORGANIZATIONS_SWAGGER.SUSPEND_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.NOT_FOUND,
    ErrorCode.CONFLICT,
  )
  async suspend(@Param('id', ParseObjectIdPipe) id: string) {
    const org = await this.organizationsService.suspend(id);
    return toOrganizationResponse(org);
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @SuperAdminOnly()
  @ApiBearerAuth(SWAGGER_DEFAULTS.AUTH_BEARER_NAME)
  @ApiOperation({
    summary: ORGANIZATIONS_SWAGGER.REACTIVATE_SUMMARY,
    description: ORGANIZATIONS_SWAGGER.REACTIVATE_DESCRIPTION,
  })
  @ApiOkResponse({
    description: ORGANIZATIONS_SWAGGER.REACTIVATE_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.NOT_FOUND,
    ErrorCode.CONFLICT,
  )
  async reactivate(@Param('id', ParseObjectIdPipe) id: string) {
    const org = await this.organizationsService.reactivate(id);
    return toOrganizationResponse(org);
  }
}
