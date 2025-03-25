import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { TicketStatus } from "../enums/ticket-status.enum";
import { TicketPriority } from "../enums/ticket-priority.enum";

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

    @Prop({ type: String, required: true, index: true }) 
    createdBy: string;

    @Prop({ type: String })
    assignedTo: string;
}

export const TicketDocument = SchemaFactory.createForClass(Ticket);
