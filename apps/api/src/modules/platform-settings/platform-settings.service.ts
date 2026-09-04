import { Injectable } from '@nestjs/common';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { PlatformSettingsRepository } from './platform-settings.repository';
import { PlatformSettingsDocument } from './platform-settings.schema';

@Injectable()
export class PlatformSettingsService {
  constructor(
    private readonly platformSettingsRepository: PlatformSettingsRepository,
  ) {}

  async getSettings(): Promise<PlatformSettingsDocument> {
    const existing = await this.platformSettingsRepository.findOne({});
    if (existing) {
      return existing;
    }

    return this.platformSettingsRepository.create({
      requireOrgApproval: true,
    });
  }

  async updateSettings(
    dto: UpdatePlatformSettingsDto,
  ): Promise<PlatformSettingsDocument> {
    const current = await this.getSettings();
    const updated = await this.platformSettingsRepository.updateById(
      current._id.toString(),
      { $set: { requireOrgApproval: dto.requireOrgApproval } },
    );
    return updated || current;
  }
}
