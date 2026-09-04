import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ClientSession, Types } from 'mongoose';
import { Role } from '@trackit/types';
import { UsersRepository } from './user.repository';
import { User, UserDocument } from './user.schema';
import { SALT_ROUNDS } from './users.constants';

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role: Role;
  organizationId?: Types.ObjectId | string | null;
  isActive?: boolean;
}

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(
    dto: CreateUserDto,
    session?: ClientSession,
  ): Promise<UserDocument> {
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const userDoc: Partial<User> = {
      email: dto.email.toLowerCase(),
      passwordHash,
      name: dto.name.trim(),
      role: dto.role,
      organizationId: dto.organizationId
        ? (new Types.ObjectId(dto.organizationId.toString()) as unknown as Types.ObjectId)
        : null,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    };

    return this.usersRepository.create(userDoc, { session });
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.usersRepository.findByEmailWithPassword(email);
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.usersRepository.findById(id);
  }

  async findByIdWithRefreshToken(id: string): Promise<UserDocument | null> {
    return this.usersRepository.findByIdWithRefreshToken(id);
  }

  async updateRefreshTokenHash(
    userId: string,
    refreshTokenHash: string,
  ): Promise<UserDocument | null> {
    return this.usersRepository.updateRefreshTokenHash(userId, refreshTokenHash);
  }

  async clearRefreshTokenHash(userId: string): Promise<UserDocument | null> {
    return this.usersRepository.updateRefreshTokenHash(userId, null);
  }
}
