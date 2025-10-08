import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus } from '../enums/ticket-status.enum';

export class TicketStatusResponseDto {
  @ApiProperty({ description: 'Current status of the ticket', enum: TicketStatus })
  status: TicketStatus;
}
