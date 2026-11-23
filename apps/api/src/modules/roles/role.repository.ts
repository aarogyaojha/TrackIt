import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/database/base.repository';
import { Role, RoleDocument } from './role.schema';

@Injectable()
export class RolesRepository extends BaseRepository<RoleDocument> {
  constructor(
    @InjectModel(Role.name)
    roleModel: Model<RoleDocument>,
  ) {
    super(roleModel);
  }

  async findByKey(key: string): Promise<RoleDocument | null> {
    return this.findOne({ key: key.toUpperCase().trim() });
  }

  async findByName(name: string): Promise<RoleDocument | null> {
    return this.findOne({ name: name.trim() });
  }

  async findAllRoles(): Promise<RoleDocument[]> {
    return this.find({}, undefined, { sort: { isSystem: -1, createdAt: 1 } });
  }
}
