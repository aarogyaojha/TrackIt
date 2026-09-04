import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/database/base.repository';
import {
  PlatformSettings,
  PlatformSettingsDocument,
} from './platform-settings.schema';

@Injectable()
export class PlatformSettingsRepository extends BaseRepository<PlatformSettingsDocument> {
  constructor(
    @InjectModel(PlatformSettings.name)
    platformSettingsModel: Model<PlatformSettingsDocument>,
  ) {
    super(platformSettingsModel);
  }
}
