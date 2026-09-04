import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { toJsonTransform } from '../../common/database/schema-options';

export type PlatformSettingsDocument = HydratedDocument<PlatformSettings>;

@Schema({
  timestamps: true,
  toJSON: {
    transform: toJsonTransform,
  },
})
export class PlatformSettings {
  @Prop({
    type: Boolean,
    default: true,
  })
  requireOrgApproval: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PlatformSettingsSchema =
  SchemaFactory.createForClass(PlatformSettings);
