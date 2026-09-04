import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryOptions } from 'mongoose';
import { BaseRepository } from '../../common/database/base.repository';
import { Organization, OrganizationDocument } from './organization.schema';

@Injectable()
export class OrganizationsRepository extends BaseRepository<OrganizationDocument> {
  constructor(
    @InjectModel(Organization.name)
    organizationModel: Model<OrganizationDocument>,
  ) {
    super(organizationModel);
  }

  async findBySlug(
    slug: string,
    options?: QueryOptions<OrganizationDocument>,
  ): Promise<OrganizationDocument | null> {
    return this.findOne({ slug: slug.toLowerCase() }, undefined, options);
  }
}
