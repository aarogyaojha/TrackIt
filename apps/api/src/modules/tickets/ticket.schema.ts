import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { TicketStatus } from '@trackit/types';
import { toJsonTransform } from '../../common/database/schema-options';

export type TicketDocument = HydratedDocument<Ticket>;

@Schema({ _id: false })
export class TicketStatusHistoryItem {
  @Prop({
    type: String,
    enum: TicketStatus,
    required: true,
  })
  status: TicketStatus;

  @Prop({
    type: Date,
    required: true,
    default: () => new Date(),
  })
  changedAt: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  changedBy: Types.ObjectId;
}

export const TicketStatusHistoryItemSchema =
  SchemaFactory.createForClass(TicketStatusHistoryItem);

@Schema({
  timestamps: true,
  toJSON: {
    transform: toJsonTransform,
  },
})
export class Ticket {
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
    uppercase: true,
    trim: true,
  })
  code: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  customerName: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  customerPhone: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  itemDescription: string;

  @Prop({
    type: String,
    enum: TicketStatus,
    default: TicketStatus.RECEIVED,
    required: true,
  })
  status: TicketStatus;

  @Prop({
    type: [TicketStatusHistoryItemSchema],
    default: [],
  })
  statusHistory: TicketStatusHistoryItem[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

TicketSchema.index({ organizationId: 1, code: 1 }, { unique: true });
