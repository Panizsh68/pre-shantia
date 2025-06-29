import { Types } from 'mongoose';
import { TicketStatus } from '../enums/ticket-status.enum';
import { TicketPriority } from '../enums/ticket-priority.enum';

export interface ITicket {
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdBy?: string;
  assignedTo?: string;
  id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
