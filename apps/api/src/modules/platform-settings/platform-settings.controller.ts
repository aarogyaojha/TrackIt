import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiStandardErrors } from '../../common/decorators/api-standard-errors.decorator';
import { ErrorCode } from '../../constants';
import { SWAGGER_DEFAULTS } from '../../constants/swagger.constants';
import { SuperAdminOnly } from '../auth/decorators/super-admin-only.decorator';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { PLATFORM_SETTINGS_SWAGGER } from './platform-settings.constants';
import { toPlatformSettingsResponse } from './platform-settings.response';
import { PlatformSettingsService } from './platform-settings.service';

@ApiTags(PLATFORM_SETTINGS_SWAGGER.TAG)
@ApiBearerAuth(SWAGGER_DEFAULTS.AUTH_BEARER_NAME)
@SuperAdminOnly()
@Controller('platform-settings')
export class PlatformSettingsController {
  constructor(
    private readonly platformSettingsService: PlatformSettingsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: PLATFORM_SETTINGS_SWAGGER.GET_SUMMARY,
    description: PLATFORM_SETTINGS_SWAGGER.GET_DESCRIPTION,
  })
  @ApiOkResponse({
    description: PLATFORM_SETTINGS_SWAGGER.GET_OK_DESCRIPTION,
  })
  @ApiStandardErrors(ErrorCode.UNAUTHORIZED, ErrorCode.FORBIDDEN)
  async getSettings() {
    const settings = await this.platformSettingsService.getSettings();
    return toPlatformSettingsResponse(settings);
  }

  @Patch()
  @ApiOperation({
    summary: PLATFORM_SETTINGS_SWAGGER.UPDATE_SUMMARY,
    description: PLATFORM_SETTINGS_SWAGGER.UPDATE_DESCRIPTION,
  })
  @ApiOkResponse({
    description: PLATFORM_SETTINGS_SWAGGER.UPDATE_OK_DESCRIPTION,
  })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
  )
  async updateSettings(@Body() dto: UpdatePlatformSettingsDto) {
    const settings = await this.platformSettingsService.updateSettings(dto);
    return toPlatformSettingsResponse(settings);
  }
}

