import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { OrgStatus } from '@trackit/types';
import { toJsonTransform } from '../../common/database/schema-options';

export type OrganizationDocument = HydratedDocument<Organization>;

@Schema({
  timestamps: true,
  toJSON: {
    transform: toJsonTransform,
  },
})
export class Organization {
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  slug: string;

  @Prop({
    type: String,
    enum: OrgStatus,
    default: OrgStatus.PENDING,
    required: true,
  })
  status: OrgStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
