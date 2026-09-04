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

  async countByOrganizationId(
    organizationId: string | Types.ObjectId,
  ): Promise<number> {
    return this.model.countDocuments({ organizationId }).exec();
  }
}

