import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TicketStatus } from '../enums/ticket-status.enum';
import { TicketPriority } from '../enums/ticket-priority.enum';

// Comment/Reply subdocument
@Schema({ _id: true, timestamps: true })
export class TicketComment {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Date, default: () => new Date() })
  createdAt?: Date;

  @Prop({ type: Date, default: () => new Date() })
  updatedAt?: Date;

  id?: Types.ObjectId;
}

@Schema({ timestamps: true })
export class Ticket extends Document {
  @Prop({ required: true, index: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: TicketStatus.Open })
  status: TicketStatus;

  @Prop({ default: TicketPriority.Low })
  priority: TicketPriority;

  @Prop({ type: String, index: true, required: true })
  createdBy: string;

  @Prop({ type: String, required: true, index: true })
  assignedTo: string;

  @Prop({ type: String, index: true })
  orderId?: string;

  @Prop({
    type: [TicketComment],
    default: [],
  })
  comments?: TicketComment[];

  id: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TicketCommentSchema = SchemaFactory.createForClass(TicketComment);
export const TicketSchema = SchemaFactory.createForClass(Ticket);

