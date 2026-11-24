import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Permission } from '@trackit/types';
import { ApiStandardErrors } from '../../common/decorators/api-standard-errors.decorator';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { ErrorCode } from '../../constants';
import { SWAGGER_DEFAULTS } from '../../constants/swagger.constants';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { UpdateStaffUserDto } from './dto/update-staff-user.dto';
import { toUserResponse } from './user.response';
import { UsersService } from './user.service';
import { USERS_SWAGGER } from './users.constants';

@ApiTags(USERS_SWAGGER.TAG)
@ApiBearerAuth(SWAGGER_DEFAULTS.AUTH_BEARER_NAME)
@UseGuards(TenantGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions(Permission.USERS_READ)
  @ApiOperation({
    summary: USERS_SWAGGER.LIST_SUMMARY,
    description: USERS_SWAGGER.LIST_DESCRIPTION,
  })
  @ApiOkResponse({
    description: USERS_SWAGGER.LIST_OK_DESCRIPTION,
  })
  @ApiStandardErrors(ErrorCode.UNAUTHORIZED, ErrorCode.FORBIDDEN)
  async listStaff(@CurrentOrg() orgId: string) {
    const users = await this.usersService.listStaffByOrganization(orgId);
    return users.map((u) => toUserResponse(u));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(Permission.USERS_CREATE)
  @ApiOperation({
    summary: USERS_SWAGGER.CREATE_SUMMARY,
    description: USERS_SWAGGER.CREATE_DESCRIPTION,
  })
  @ApiCreatedResponse({
    description: USERS_SWAGGER.CREATE_CREATED_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.CONFLICT,
    ErrorCode.PLAN_LIMIT_EXCEEDED,
  )
  async createStaff(
    @CurrentOrg() orgId: string,
    @Body() dto: CreateStaffUserDto,
  ) {
    const user = await this.usersService.createStaffUser(orgId, dto);
    return toUserResponse(user);
  }

  @Patch(':id')
  @RequirePermissions(Permission.USERS_UPDATE)
  @ApiOperation({
    summary: USERS_SWAGGER.UPDATE_SUMMARY,
    description: USERS_SWAGGER.UPDATE_DESCRIPTION,
  })
  @ApiOkResponse({
    description: USERS_SWAGGER.UPDATE_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.NOT_FOUND,
    ErrorCode.CANNOT_DELETE_SELF,
    ErrorCode.CANNOT_REMOVE_LAST_ADMIN,
  )
  async updateStaff(
    @CurrentOrg() orgId: string,
    @CurrentUser('userId') currentUserId: string,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateStaffUserDto,
  ) {
    const user = await this.usersService.updateStaffUser(
      orgId,
      id,
      currentUserId,
      dto,
    );
    return toUserResponse(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(Permission.USERS_DELETE)
  @ApiOperation({
    summary: USERS_SWAGGER.DELETE_SUMMARY,
    description: USERS_SWAGGER.DELETE_DESCRIPTION,
  })
  @ApiOkResponse({
    description: USERS_SWAGGER.DELETE_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.NOT_FOUND,
    ErrorCode.CANNOT_DELETE_SELF,
    ErrorCode.CANNOT_REMOVE_LAST_ADMIN,
  )
  async deleteStaff(
    @CurrentOrg() orgId: string,
    @CurrentUser('userId') currentUserId: string,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    await this.usersService.deleteStaffUser(orgId, id, currentUserId);
  }
}
