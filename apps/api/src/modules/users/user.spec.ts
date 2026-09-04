import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { Role } from '@trackit/types';
import { UsersRepository } from './user.repository';
import { UserDocument } from './user.schema';
import { UsersService } from './user.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  const mockRepository = {
    create: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    findById: jest.fn(),
    findByIdWithRefreshToken: jest.fn(),
    updateRefreshTokenHash: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersRepository);
  });

  describe('createUser', () => {
    it('should hash password with SALT_ROUNDS before persisting', async () => {
      const orgId = new Types.ObjectId();
      const plainPassword = 'PlainPassword123!';
      const dto = {
        email: 'TEST@example.com',
        password: plainPassword,
        name: 'Test User',
        role: Role.ORG_ADMIN,
        organizationId: orgId,
      };

      const createdUserMock = {
        _id: new Types.ObjectId(),
        email: 'test@example.com',
        name: 'Test User',
        role: Role.ORG_ADMIN,
        organizationId: orgId,
        passwordHash: 'hashed_password',
        isActive: true,
      } as unknown as UserDocument;

      repository.create.mockResolvedValue(createdUserMock);

      const result = await service.createUser(dto);

      expect(repository.create).toHaveBeenCalledTimes(1);
      const passedDoc = repository.create.mock.calls[0][0];

      expect(passedDoc.email).toBe('test@example.com');
      expect(passedDoc.name).toBe('Test User');
      expect(passedDoc.role).toBe(Role.ORG_ADMIN);
      expect(passedDoc.organizationId).toEqual(orgId);
      expect(passedDoc.passwordHash).not.toBe(plainPassword);

      // Verify bcrypt hash matches the password
      const isMatch = await bcrypt.compare(plainPassword, passedDoc.passwordHash!);
      expect(isMatch).toBe(true);

      expect(result).toBe(createdUserMock);
    });
  });

  describe('findByEmail', () => {
    it('should return user document when found', async () => {
      const userMock = {
        _id: new Types.ObjectId(),
        email: 'found@example.com',
        passwordHash: 'some_hash',
      } as unknown as UserDocument;

      repository.findByEmailWithPassword.mockResolvedValue(userMock);

      const result = await service.findByEmail('found@example.com');

      expect(repository.findByEmailWithPassword).toHaveBeenCalledWith(
        'found@example.com',
      );
      expect(result).toBe(userMock);
    });

    it('should return null when user is not found', async () => {
      repository.findByEmailWithPassword.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(repository.findByEmailWithPassword).toHaveBeenCalledWith(
        'notfound@example.com',
      );
      expect(result).toBeNull();
    });
  });
});
