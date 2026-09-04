import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { PLATFORM_SETTINGS_DTO_SWAGGER } from '../platform-settings.constants';

export class UpdatePlatformSettingsDto {
  @ApiProperty({
    description: PLATFORM_SETTINGS_DTO_SWAGGER.REQUIRE_ORG_APPROVAL_DESCRIPTION,
    example: PLATFORM_SETTINGS_DTO_SWAGGER.REQUIRE_ORG_APPROVAL_EXAMPLE,
  })
  @IsBoolean()
  requireOrgApproval: boolean;
}
