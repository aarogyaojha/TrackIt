import { Test, TestingModule } from '@nestjs/testing';
import { PlatformSettingsRepository } from './platform-settings.repository';
import { PlatformSettingsDocument } from './platform-settings.schema';
import { PlatformSettingsService } from './platform-settings.service';

describe('PlatformSettingsService', () => {
  let service: PlatformSettingsService;
  let repository: jest.Mocked<PlatformSettingsRepository>;

  const mockSettings = {
    _id: 'settings-123',
    requireOrgApproval: true,
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformSettingsService,
        {
          provide: PlatformSettingsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PlatformSettingsService>(PlatformSettingsService);
    repository = module.get(PlatformSettingsRepository);
  });

  describe('getSettings', () => {
    it('should return existing settings if found', async () => {
      repository.findOne.mockResolvedValue(
        mockSettings as unknown as PlatformSettingsDocument,
      );

      const result = await service.getSettings();

      expect(repository.findOne).toHaveBeenCalledWith({});
      expect(result).toEqual(mockSettings);
    });

    it('should create default settings if none exist', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockResolvedValue(
        mockSettings as unknown as PlatformSettingsDocument,
      );

      const result = await service.getSettings();

      expect(repository.findOne).toHaveBeenCalledWith({});
      expect(repository.create).toHaveBeenCalledWith({
        requireOrgApproval: true,
      });
      expect(result).toEqual(mockSettings);
    });
  });

  describe('updateSettings', () => {
    it('should update and return updated settings', async () => {
      repository.findOne.mockResolvedValue(
        mockSettings as unknown as PlatformSettingsDocument,
      );
      const updatedSettings = {
        ...mockSettings,
        requireOrgApproval: false,
      };
      repository.updateById.mockResolvedValue(
        updatedSettings as unknown as PlatformSettingsDocument,
      );

      const result = await service.updateSettings({
        requireOrgApproval: false,
      });

      expect(repository.updateById).toHaveBeenCalledWith('settings-123', {
        $set: { requireOrgApproval: false },
      });
      expect(result.requireOrgApproval).toBe(false);
    });
  });
});
