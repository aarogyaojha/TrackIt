import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Role } from '@trackit/types';
import { toJsonTransform } from '../../common/database/schema-options';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  toJSON: {
    transform: toJsonTransform,
  },
})
export class User {
  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    type: String,
    required: true,
    select: false,
  })
  passwordHash: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
    enum: Role,
    required: true,
  })
  role: Role;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    default: null,
    required: function (this: User) {
      return this.role !== Role.SUPERADMIN;
    },
  })
  organizationId: Types.ObjectId | null;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;

  @Prop({
    type: String,
    select: false,
    default: null,
  })
  refreshTokenHash?: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
