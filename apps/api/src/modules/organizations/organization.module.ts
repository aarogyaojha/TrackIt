import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { UsersModule } from '../users/user.module';
import { OrganizationsController } from './organization.controller';
import { OrganizationsRepository } from './organization.repository';
import {
  Organization,
  OrganizationSchema,
} from './organization.schema';
import { OrganizationsService } from './organization.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
    ]),
    UsersModule,
    PlatformSettingsModule,
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsRepository, OrganizationsService],
  exports: [OrganizationsRepository, OrganizationsService],
})
export class OrganizationsModule {}
