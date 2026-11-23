import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { StatusCategory } from '@trackit/types';
import { toJsonTransform } from '../../common/database/schema-options';

export type WorkflowDocument = HydratedDocument<Workflow>;

@Schema({ _id: false })
export class WorkflowStatus {
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  key: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  customerLabel?: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  customerDescription?: string;

  @Prop({
    type: String,
    enum: StatusCategory,
    required: true,
  })
  category: StatusCategory;

  @Prop({
    type: String,
    default: 'default',
  })
  color?: string;

  @Prop({
    type: Number,
    required: true,
    default: 0,
  })
  order: number;
}

export const WorkflowStatusSchema =
  SchemaFactory.createForClass(WorkflowStatus);

@Schema({
  timestamps: true,
  toJSON: {
    transform: toJsonTransform,
  },
})
export class Workflow {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  description?: string;

  @Prop({
    type: Boolean,
    default: false,
    index: true,
  })
  isDefault: boolean;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;

  @Prop({
    type: [WorkflowStatusSchema],
    required: true,
    default: [],
  })
  statuses: WorkflowStatus[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const WorkflowSchema = SchemaFactory.createForClass(Workflow);

WorkflowSchema.index({ organizationId: 1, name: 1 }, { unique: true });
WorkflowSchema.index(
  { organizationId: 1, isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } },
);
