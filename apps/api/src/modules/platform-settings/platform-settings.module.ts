import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlatformSettingsController } from './platform-settings.controller';
import { PlatformSettingsRepository } from './platform-settings.repository';
import {
  PlatformSettings,
  PlatformSettingsSchema,
} from './platform-settings.schema';
import { PlatformSettingsService } from './platform-settings.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlatformSettings.name, schema: PlatformSettingsSchema },
    ]),
  ],
  controllers: [PlatformSettingsController],
  providers: [PlatformSettingsRepository, PlatformSettingsService],
  exports: [PlatformSettingsRepository, PlatformSettingsService],
})
export class PlatformSettingsModule {}
