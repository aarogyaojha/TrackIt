import { Types } from 'mongoose';
import { OrgStatus } from '@trackit/types';
import { toOrganizationResponse } from './organization.response';
import { OrganizationDocument } from './organization.schema';

describe('toOrganizationResponse', () => {
  it('maps an OrganizationDocument to OrganizationResponse and excludes sensitive/internal fields', () => {
    const rawId = new Types.ObjectId();
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-02T00:00:00.000Z');

    const fakeOrgDoc = {
      _id: rawId,
      name: 'Acme Repairs',
      slug: 'acme-repairs',
      status: OrgStatus.ACTIVE,
      createdAt,
      updatedAt,
      __v: 0,
      passwordHash: 'sensitive-password-hash',
      refreshTokenHash: 'sensitive-refresh-token-hash',
    } as unknown as OrganizationDocument;

    const result = toOrganizationResponse(fakeOrgDoc);

    expect(result).toEqual({
      id: rawId.toString(),
      name: 'Acme Repairs',
      slug: 'acme-repairs',
      status: OrgStatus.ACTIVE,
      createdAt,
      updatedAt,
    });

    const keys = Object.keys(result).sort();
    expect(keys).toEqual([
      'createdAt',
      'id',
      'name',
      'slug',
      'status',
      'updatedAt',
    ]);
    expect('_id' in result).toBe(false);
    expect('__v' in result).toBe(false);
    expect('passwordHash' in result).toBe(false);
    expect('refreshTokenHash' in result).toBe(false);
  });
});
