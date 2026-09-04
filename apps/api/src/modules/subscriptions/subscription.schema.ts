import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { PlanTier } from '@trackit/types';
import { toJsonTransform } from '../../common/database/schema-options';

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema({
  timestamps: true,
  toJSON: {
    transform: toJsonTransform,
  },
})
export class Subscription {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    unique: true,
    index: true,
  })
  organizationId: Types.ObjectId;

  @Prop({
    type: String,
    enum: PlanTier,
    default: PlanTier.FREE,
    required: true,
  })
  planTier: PlanTier;

  @Prop({
    type: Number,
    default: 0,
    required: true,
  })
  ticketsThisMonth: number;

  @Prop({
    type: Date,
    default: () => new Date(),
    required: true,
  })
  currentPeriodStart: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
