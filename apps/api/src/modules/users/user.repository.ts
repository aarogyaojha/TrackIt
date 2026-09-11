import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryOptions, Types } from 'mongoose';
import { BaseRepository } from '../../common/database/base.repository';

import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersRepository extends BaseRepository<UserDocument> {
  constructor(
    @InjectModel(User.name)
    userModel: Model<UserDocument>,
  ) {
    super(userModel);
  }

  async findByEmailWithPassword(
    email: string,
    options?: QueryOptions<UserDocument>,
  ): Promise<UserDocument | null> {
    return this.findOne({ email: email.toLowerCase() }, '+passwordHash', options);
  }

  async findByIdWithRefreshToken(
    id: string,
    options?: QueryOptions<UserDocument>,
  ): Promise<UserDocument | null> {
    return this.findById(id, '+refreshTokenHash', options);
  }

  async updateRefreshTokenHash(
    id: string,
    refreshTokenHash: string | null,
  ): Promise<UserDocument | null> {
    return this.updateById(id, { $set: { refreshTokenHash } });
  }

  async findByEmailWithOtp(
    email: string,
    options?: QueryOptions<UserDocument>,
  ): Promise<UserDocument | null> {
    return this.findOne(
      { email: email.toLowerCase() },
      '+emailOtpHash +emailOtpExpiresAt +emailOtpAttempts',
      options,
    );
  }

  async setEmailOtp(
    userId: string,
    hash: string,
    expiresAt: Date,
  ): Promise<UserDocument | null> {
    return this.updateById(userId, {
      $set: {
        emailOtpHash: hash,
        emailOtpExpiresAt: expiresAt,
        emailOtpAttempts: 0,
      },
    });
  }

  async incrementOtpAttempts(userId: string): Promise<UserDocument | null> {
    return this.updateById(userId, {
      $inc: { emailOtpAttempts: 1 },
    });
  }

  async markEmailVerified(userId: string): Promise<UserDocument | null> {
    return this.updateById(userId, {
      $set: { emailVerified: true },
      $unset: {
        emailOtpHash: 1,
        emailOtpExpiresAt: 1,
        emailOtpAttempts: 1,
      },
    });
  }

  async countByOrganizationId(
    organizationId: string | Types.ObjectId,
  ): Promise<number> {
    return this.model.countDocuments({ organizationId }).exec();
  }
}

