import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus } from '../enums/ticket-status.enum';
import { TicketPriority } from '../enums/ticket-priority.enum';

export class TicketResponseDto {
  @ApiProperty({ description: 'Ticket id', example: '68d94bffebbe4333cc7f8f03' })
  id: string;

  @ApiProperty({ description: 'Title of the ticket' })
  title: string;

  @ApiProperty({ description: 'Description of the ticket' })
  description: string;

  @ApiProperty({ description: 'Status of the ticket', enum: TicketStatus, example: TicketStatus.Open })
  status: TicketStatus;

  @ApiProperty({ description: 'Priority of the ticket', enum: TicketPriority, example: TicketPriority.Low })
  priority: TicketPriority;

  @ApiPropertyOptional({ description: 'ID of the user who created the ticket' })
  createdBy?: string;

  @ApiPropertyOptional({ description: 'ID of the user assigned to the ticket' })
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Order id if this ticket is related to an order' })
  orderId?: string;

  @ApiPropertyOptional({ description: 'Created at timestamp' })
  createdAt?: Date;

  @ApiPropertyOptional({ description: 'Updated at timestamp' })
  updatedAt?: Date;
}
