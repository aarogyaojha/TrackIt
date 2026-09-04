import { Types } from 'mongoose';
import { Role } from '@trackit/types';
import { toUserResponse } from './user.response';
import { UserDocument } from './user.schema';

describe('toUserResponse', () => {
  it('maps a UserDocument to UserResponse and excludes sensitive/internal fields', () => {
    const rawUserId = new Types.ObjectId();
    const rawOrgId = new Types.ObjectId();

    const fakeUserDoc = {
      _id: rawUserId,
      email: 'john@example.com',
      name: 'John Doe',
      role: Role.ORG_ADMIN,
      organizationId: rawOrgId,
      isActive: true,
      __v: 0,
      passwordHash: 'sensitive-password-hash',
      refreshTokenHash: 'sensitive-refresh-token-hash',
    } as unknown as UserDocument;

    const result = toUserResponse(fakeUserDoc);

    expect(result).toEqual({
      id: rawUserId.toString(),
      email: 'john@example.com',
      name: 'John Doe',
      role: Role.ORG_ADMIN,
      organizationId: rawOrgId.toString(),
    });

    const keys = Object.keys(result).sort();
    expect(keys).toEqual([
      'email',
      'id',
      'name',
      'organizationId',
      'role',
    ]);
    expect('_id' in result).toBe(false);
    expect('__v' in result).toBe(false);
    expect('passwordHash' in result).toBe(false);
    expect('refreshTokenHash' in result).toBe(false);
    expect('isActive' in result).toBe(false);
  });

  it('handles null organizationId correctly for superadmin users', () => {
    const rawUserId = new Types.ObjectId();

    const fakeSuperAdminDoc = {
      _id: rawUserId,
      email: 'admin@trackit.internal',
      name: 'Super Admin',
      role: Role.SUPERADMIN,
      organizationId: null,
      __v: 0,
      passwordHash: 'sensitive-password-hash',
      refreshTokenHash: 'sensitive-refresh-token-hash',
    } as unknown as UserDocument;

    const result = toUserResponse(fakeSuperAdminDoc);

    expect(result).toEqual({
      id: rawUserId.toString(),
      email: 'admin@trackit.internal',
      name: 'Super Admin',
      role: Role.SUPERADMIN,
      organizationId: null,
    });
    expect('_id' in result).toBe(false);
    expect('__v' in result).toBe(false);
    expect('passwordHash' in result).toBe(false);
    expect('refreshTokenHash' in result).toBe(false);
  });
});
