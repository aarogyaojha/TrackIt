import { Types } from 'mongoose';
import { toPlatformSettingsResponse } from './platform-settings.response';
import { PlatformSettingsDocument } from './platform-settings.schema';

describe('toPlatformSettingsResponse', () => {
  it('maps a PlatformSettingsDocument to PlatformSettingsResponse and excludes sensitive/internal fields', () => {
    const rawId = new Types.ObjectId();
    const updatedAt = new Date('2026-01-01T12:00:00.000Z');

    const fakeSettingsDoc = {
      _id: rawId,
      requireOrgApproval: true,
      updatedAt,
      __v: 0,
      passwordHash: 'sensitive-password-hash',
      refreshTokenHash: 'sensitive-refresh-token-hash',
    } as unknown as PlatformSettingsDocument;

    const result = toPlatformSettingsResponse(fakeSettingsDoc);

    expect(result).toEqual({
      requireOrgApproval: true,
      updatedAt,
    });

    const keys = Object.keys(result).sort();
    expect(keys).toEqual(['requireOrgApproval', 'updatedAt']);
    expect('_id' in result).toBe(false);
    expect('__v' in result).toBe(false);
    expect('passwordHash' in result).toBe(false);
    expect('refreshTokenHash' in result).toBe(false);
  });
});
