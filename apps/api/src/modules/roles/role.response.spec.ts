import { Types } from 'mongoose';
import { Permission } from '@trackit/types';
import { toRoleResponse } from './role.response';
import { RoleDocument } from './role.schema';

describe('toRoleResponse', () => {
  it('correctly maps a RoleDocument to RoleResponse format', () => {
    const mockRole = {
      _id: new Types.ObjectId(),
      name: 'Custom Role',
      key: 'CUSTOM_ROLE',
      description: 'A test custom role',
      permissions: [Permission.TICKETS_CREATE, Permission.TICKETS_READ],
      isSystem: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    } as unknown as RoleDocument;

    const res = toRoleResponse(mockRole);

    expect(res).toEqual({
      id: mockRole._id.toString(),
      name: 'Custom Role',
      key: 'CUSTOM_ROLE',
      description: 'A test custom role',
      permissions: [Permission.TICKETS_CREATE, Permission.TICKETS_READ],
      isSystem: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });
  });
});
