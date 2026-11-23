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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@trackit/types';
import { ApiStandardErrors } from '../../common/decorators/api-standard-errors.decorator';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { ErrorCode } from '../../constants';
import { SWAGGER_DEFAULTS } from '../../constants/swagger.constants';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { WORKFLOWS_SWAGGER } from './workflow.constants';
import {
  toWorkflowResponse,
  toWorkflowSummaryResponse,
  WorkflowDetailResponse,
  WorkflowSummaryResponse,
} from './workflow.response';
import { WorkflowsService } from './workflow.service';

@ApiTags(WORKFLOWS_SWAGGER.TAG)
@ApiBearerAuth(SWAGGER_DEFAULTS.AUTH_BEARER_NAME)
@UseGuards(TenantGuard)
@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  @Roles(Role.ORG_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: WORKFLOWS_SWAGGER.CREATE_SUMMARY,
    description: WORKFLOWS_SWAGGER.CREATE_DESCRIPTION,
  })
  @ApiCreatedResponse({
    description: WORKFLOWS_SWAGGER.CREATE_CREATED_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.CONFLICT,
  )
  async create(
    @CurrentOrg() orgId: string,
    @Body() dto: CreateWorkflowDto,
  ): Promise<WorkflowDetailResponse> {
    const workflow = await this.workflowsService.create(orgId, dto);
    return toWorkflowResponse(workflow);
  }

  @Get()
  @Roles(Role.ORG_ADMIN, Role.ORG_STAFF)
  @ApiOperation({
    summary: WORKFLOWS_SWAGGER.LIST_SUMMARY,
    description: WORKFLOWS_SWAGGER.LIST_DESCRIPTION,
  })
  @ApiOkResponse({
    description: WORKFLOWS_SWAGGER.LIST_OK_DESCRIPTION,
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Filter only active workflows',
  })
  @ApiStandardErrors(
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
  )
  async list(
    @CurrentOrg() orgId: string,
    @Query('activeOnly') activeOnly?: string,
  ): Promise<WorkflowSummaryResponse[]> {
    const isActiveOnly = activeOnly === 'true';
    const workflows = await this.workflowsService.listByOrg(orgId, isActiveOnly);
    return workflows.map(toWorkflowSummaryResponse);
  }

  @Get(':id')
  @Roles(Role.ORG_ADMIN, Role.ORG_STAFF)
  @ApiOperation({
    summary: WORKFLOWS_SWAGGER.GET_BY_ID_SUMMARY,
    description: WORKFLOWS_SWAGGER.GET_BY_ID_DESCRIPTION,
  })
  @ApiOkResponse({
    description: WORKFLOWS_SWAGGER.GET_BY_ID_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.NOT_FOUND,
  )
  async getById(
    @CurrentOrg() orgId: string,
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<WorkflowDetailResponse> {
    const workflow = await this.workflowsService.getByIdScoped(orgId, id);
    return toWorkflowResponse(workflow);
  }

  @Patch(':id')
  @Roles(Role.ORG_ADMIN)
  @ApiOperation({
    summary: WORKFLOWS_SWAGGER.UPDATE_SUMMARY,
    description: WORKFLOWS_SWAGGER.UPDATE_DESCRIPTION,
  })
  @ApiOkResponse({
    description: WORKFLOWS_SWAGGER.UPDATE_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.NOT_FOUND,
    ErrorCode.CONFLICT,
  )
  async update(
    @CurrentOrg() orgId: string,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateWorkflowDto,
  ): Promise<WorkflowDetailResponse> {
    const updated = await this.workflowsService.update(orgId, id, dto);
    return toWorkflowResponse(updated);
  }

  @Delete(':id')
  @Roles(Role.ORG_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: WORKFLOWS_SWAGGER.DELETE_SUMMARY,
    description: WORKFLOWS_SWAGGER.DELETE_DESCRIPTION,
  })
  @ApiOkResponse({
    description: WORKFLOWS_SWAGGER.DELETE_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.NOT_FOUND,
    ErrorCode.CONFLICT,
  )
  async delete(
    @CurrentOrg() orgId: string,
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<void> {
    await this.workflowsService.delete(orgId, id);
  }
}

