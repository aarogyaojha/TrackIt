import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Permission } from '@trackit/types';
import { toJsonTransform } from '../../common/database/schema-options';

export type RoleDocument = HydratedDocument<Role>;

@Schema({
  timestamps: true,
  toJSON: {
    transform: toJsonTransform,
  },
})
export class Role {
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
    uppercase: true,
    trim: true,
  })
  key: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  description: string;

  @Prop({
    type: [String],
    enum: Permission,
    default: [],
  })
  permissions: Permission[];

  @Prop({
    type: Boolean,
    default: false,
  })
  isSystem: boolean;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
