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
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SuperAdminOnly } from '../auth/decorators/super-admin-only.decorator';
import { UsersRepository } from '../users/user.repository';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ROLES_SWAGGER } from './role.constants';
import { toRoleResponse } from './role.response';
import { RolesService } from './role.service';

@ApiTags(ROLES_SWAGGER.TAG)
@Controller('roles')
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly usersRepository: UsersRepository,
  ) {}

  @Get()
  @RequirePermissions(Permission.ROLES_READ)
  @ApiBearerAuth(SWAGGER_DEFAULTS.AUTH_BEARER_NAME)
  @ApiOperation({
    summary: ROLES_SWAGGER.LIST_SUMMARY,
    description: ROLES_SWAGGER.LIST_DESCRIPTION,
  })
  @ApiOkResponse({
    description: ROLES_SWAGGER.LIST_OK_DESCRIPTION,
  })
  @ApiStandardErrors(ErrorCode.UNAUTHORIZED, ErrorCode.FORBIDDEN)
  async listRoles() {
    const roles = await this.rolesService.listRoles();
    return roles.map(toRoleResponse);
  }

  @Get(':id')
  @RequirePermissions(Permission.ROLES_READ)
  @ApiBearerAuth(SWAGGER_DEFAULTS.AUTH_BEARER_NAME)
  @ApiOperation({
    summary: ROLES_SWAGGER.GET_BY_ID_SUMMARY,
    description: ROLES_SWAGGER.GET_BY_ID_DESCRIPTION,
  })
  @ApiOkResponse({
    description: ROLES_SWAGGER.GET_BY_ID_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.NOT_FOUND,
  )
  async getRoleById(@Param('id', ParseObjectIdPipe) id: string) {
    const role = await this.rolesService.getRoleById(id);
    return toRoleResponse(role);
  }

  @Post()
  @SuperAdminOnly()
  @ApiBearerAuth(SWAGGER_DEFAULTS.AUTH_BEARER_NAME)
  @ApiOperation({
    summary: ROLES_SWAGGER.CREATE_SUMMARY,
    description: ROLES_SWAGGER.CREATE_DESCRIPTION,
  })
  @ApiCreatedResponse({
    description: ROLES_SWAGGER.CREATE_CREATED_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.CONFLICT,
  )
  async createRole(@Body() dto: CreateRoleDto) {
    const role = await this.rolesService.createRole(dto);
    return toRoleResponse(role);
  }

  @Patch(':id')
  @SuperAdminOnly()
  @ApiBearerAuth(SWAGGER_DEFAULTS.AUTH_BEARER_NAME)
  @ApiOperation({
    summary: ROLES_SWAGGER.UPDATE_SUMMARY,
    description: ROLES_SWAGGER.UPDATE_DESCRIPTION,
  })
  @ApiOkResponse({
    description: ROLES_SWAGGER.UPDATE_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.NOT_FOUND,
    ErrorCode.CONFLICT,
  )
  async updateRole(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    const role = await this.rolesService.updateRole(id, dto);
    return toRoleResponse(role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @SuperAdminOnly()
  @ApiBearerAuth(SWAGGER_DEFAULTS.AUTH_BEARER_NAME)
  @ApiOperation({
    summary: ROLES_SWAGGER.DELETE_SUMMARY,
    description: ROLES_SWAGGER.DELETE_DESCRIPTION,
  })
  @ApiOkResponse({
    description: ROLES_SWAGGER.DELETE_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.NOT_FOUND,
    ErrorCode.CONFLICT,
  )
  async deleteRole(@Param('id', ParseObjectIdPipe) id: string) {
    await this.rolesService.deleteRole(id, async (roleKey) => {
      const count = await this.usersRepository.countByRole(roleKey);
      return count > 0;
    });
  }
}
