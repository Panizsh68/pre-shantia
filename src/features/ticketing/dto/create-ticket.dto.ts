import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus } from '../enums/ticket-status.enum';
import { TicketPriority } from '../enums/ticket-priority.enum';

export class CreateTicketDto {
  @ApiProperty({
    description: 'Title of the ticket',
    example: 'Issue with payment',
  })
  @IsNotEmpty({ message: 'Title is empty' })
  @IsString({ message: 'Title must be a string' })
  title: string;

  @ApiProperty({
    description: 'Description of the ticket',
    example: 'Payment failed during checkout',
  })
  @IsNotEmpty({ message: 'Description is empty' })
  @IsString({ message: 'Description must be a string' })
  description: string;

  @ApiPropertyOptional({
    description: 'Status of the ticket',
    enum: TicketStatus,
    default: TicketStatus.Open,
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus = TicketStatus.Open;

  @ApiPropertyOptional({
    description: 'Priority of the ticket',
    enum: TicketPriority,
    default: TicketPriority.Low,
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority = TicketPriority.Low;

  @ApiPropertyOptional({
    description: 'Order id if this ticket is related to an order',
    example: '507f1f77bcf86cd799439099',
  })
  @IsOptional()
  @IsString()
  orderId?: string;

  // Internal fields (set by controller, not exposed to API)
  createdBy?: string;
  assignedTo?: string;
}

