import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { PlanLimits } from '@trackit/types';
import { PlanTier } from '@trackit/types';
import { toJsonTransform } from '../../common/database/schema-options';


export type PlanDocument = HydratedDocument<Plan>;

@Schema({ _id: false })
export class PlanLimitsSchemaClass implements PlanLimits {
  @Prop({ type: Number, required: true })
  maxActiveTickets: number;

  @Prop({ type: Number, required: true })
  maxStaffUsers: number;

  @Prop({ type: Number, required: true })
  maxTicketsPerMonth: number;
}

export const PlanLimitsSchema =
  SchemaFactory.createForClass(PlanLimitsSchemaClass);

@Schema({
  timestamps: true,
  toJSON: {
    transform: toJsonTransform,
  },
})
export class Plan {
  @Prop({
    type: String,
    enum: PlanTier,
    required: true,
    unique: true,
    index: true,
  })
  tier: PlanTier;

  @Prop({
    type: PlanLimitsSchema,
    required: true,
  })
  limits: PlanLimits;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
