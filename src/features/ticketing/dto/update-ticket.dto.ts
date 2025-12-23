import { IsOptional, IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus } from '../enums/ticket-status.enum';
import { TicketPriority } from '../enums/ticket-priority.enum';

export class UpdateTicketDto {
  @ApiPropertyOptional({
    description: 'Title of the ticket',
    example: 'Updated issue with payment',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Title cannot be empty if provided' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Description of the ticket',
    example: 'Updated description for payment issue',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Description cannot be empty if provided' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Status of the ticket',
    enum: TicketStatus,
    example: TicketStatus.InProgress,
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({
    description: 'Priority of the ticket',
    enum: TicketPriority,
    example: TicketPriority.High,
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  // Note: createdBy and assignedTo are immutable - set at creation time only
}

