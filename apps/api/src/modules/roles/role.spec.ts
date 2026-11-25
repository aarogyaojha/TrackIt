import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Permission } from '@trackit/types';
import { ErrorCode } from '../../constants';
import { RolesRepository } from './role.repository';
import { RoleDocument } from './role.schema';
import { RolesService } from './role.service';

describe('RolesService', () => {
  let service: RolesService;
  let repository: jest.Mocked<RolesRepository>;

  const mockRoleDoc = (override: Partial<RoleDocument> = {}): RoleDocument =>
    ({
      _id: new Types.ObjectId(),
      name: 'Test Role',
      key: 'TEST_ROLE',
      description: 'A test role description',
      permissions: [Permission.TICKETS_CREATE, Permission.TICKETS_READ],
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...override,
    }) as unknown as RoleDocument;

  beforeEach(async () => {
    const mockRepo = {
      findByKey: jest.fn(),
      findByName: jest.fn(),
      findAllRoles: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: RolesRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    repository = module.get(RolesRepository);
  });

  describe('createRole', () => {
    it('creates a new custom role with uppercase key and trimmed strings', async () => {
      repository.findByKey.mockResolvedValue(null);
      const createdRole = mockRoleDoc({
        name: 'Technician',
        key: 'TECHNICIAN',
        permissions: [Permission.TICKETS_READ, Permission.TICKETS_UPDATE_STATUS],
      });
      repository.create.mockResolvedValue(createdRole);

      const res = await service.createRole({
        name: '  Technician  ',
        key: 'technician',
        description: '  Repairs items  ',
        permissions: [Permission.TICKETS_READ, Permission.TICKETS_UPDATE_STATUS],
      });

      expect(repository.findByKey).toHaveBeenCalledWith('TECHNICIAN');
      expect(repository.create).toHaveBeenCalledWith({
        name: 'Technician',
        key: 'TECHNICIAN',
        description: 'Repairs items',
        permissions: [Permission.TICKETS_READ, Permission.TICKETS_UPDATE_STATUS],
        isSystem: false,
      });
      expect(res).toBe(createdRole);
    });

    it('throws 409 ROLE_KEY_EXISTS if role key is already taken', async () => {
      repository.findByKey.mockResolvedValue(mockRoleDoc());

      await expect(
        service.createRole({
          name: 'Another Role',
          key: 'TEST_ROLE',
          permissions: [Permission.TICKETS_READ],
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.CONFLICT,
          code: ErrorCode.ROLE_KEY_EXISTS,
        }),
      );
    });

    it('forbids creating a role with reserved key SUPERADMIN', async () => {
      await expect(
        service.createRole({
          name: 'Fake Superadmin',
          key: 'superadmin',
          permissions: [Permission.TICKETS_READ],
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.FORBIDDEN,
          code: ErrorCode.FORBIDDEN,
        }),
      );
    });

    it('forbids assigning PLATFORM_ALL permission to a custom role', async () => {
      await expect(
        service.createRole({
          name: 'Escalated Role',
          key: 'ESCALATED',
          permissions: [Permission.PLATFORM_ALL],
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.FORBIDDEN,
          code: ErrorCode.FORBIDDEN,
        }),
      );
    });
  });

  describe('updateRole', () => {
    it('updates role description and permissions for custom role', async () => {
      const existing = mockRoleDoc();
      repository.findById.mockResolvedValue(existing);
      const updated = mockRoleDoc({ description: 'New description' });
      repository.updateById.mockResolvedValue(updated);

      const res = await service.updateRole(existing._id.toString(), {
        description: 'New description',
        permissions: [Permission.TICKETS_READ],
      });

      expect(repository.updateById).toHaveBeenCalledWith(existing._id.toString(), {
        $set: {
          description: 'New description',
          permissions: [Permission.TICKETS_READ],
        },
      });
      expect(res).toBe(updated);
    });

    it('rejects renaming a built-in system role with 400 ROLE_CANNOT_DELETE_SYSTEM', async () => {
      const systemRole = mockRoleDoc({ isSystem: true, name: 'Organization Admin', key: 'ORG_ADMIN' });
      repository.findById.mockResolvedValue(systemRole);

      await expect(
        service.updateRole(systemRole._id.toString(), {
          name: 'Renamed System Role',
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
          code: ErrorCode.ROLE_CANNOT_DELETE_SYSTEM,
        }),
      );
    });
  });

  describe('deleteRole', () => {
    it('deletes custom role when not in use', async () => {
      const existing = mockRoleDoc({ isSystem: false });
      repository.findById.mockResolvedValue(existing);
      repository.deleteById.mockResolvedValue(existing);

      await service.deleteRole(existing._id.toString(), async () => false);

      expect(repository.deleteById).toHaveBeenCalledWith(existing._id.toString());
    });

    it('blocks deleting a system role with 400 ROLE_CANNOT_DELETE_SYSTEM', async () => {
      const systemRole = mockRoleDoc({ isSystem: true });
      repository.findById.mockResolvedValue(systemRole);

      await expect(
        service.deleteRole(systemRole._id.toString()),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
          code: ErrorCode.ROLE_CANNOT_DELETE_SYSTEM,
        }),
      );
    });

    it('blocks deleting a role that is currently in use with 409 ROLE_IN_USE', async () => {
      const existing = mockRoleDoc({ isSystem: false });
      repository.findById.mockResolvedValue(existing);

      await expect(
        service.deleteRole(existing._id.toString(), async () => true),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.CONFLICT,
          code: ErrorCode.ROLE_IN_USE,
        }),
      );
    });
  });

  describe('getPermissionsForRole', () => {
    it('returns PLATFORM_ALL for SUPERADMIN', async () => {
      const perms = await service.getPermissionsForRole('SUPERADMIN');
      expect(perms).toEqual([Permission.PLATFORM_ALL]);
    });

    it('fetches permissions from role document if present', async () => {
      const role = mockRoleDoc({
        key: 'CUSTOM',
        permissions: [Permission.TICKETS_CREATE],
      });
      repository.findByKey.mockResolvedValue(role);

      const perms = await service.getPermissionsForRole('CUSTOM');
      expect(perms).toEqual([Permission.TICKETS_CREATE]);
    });

    it('falls back to default system permissions if role not in database', async () => {
      repository.findByKey.mockResolvedValue(null);

      const perms = await service.getPermissionsForRole('ORG_STAFF');
      expect(perms).toContain(Permission.TICKETS_CREATE);
      expect(perms).toContain(Permission.TICKETS_READ);
    });
  });
});
