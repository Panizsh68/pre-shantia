import { Ticket } from '../entities/ticketing.entity';
import { TicketResponseDto } from '../dto/ticket-response.dto';

export function ticketToResponseDto(t: Ticket): TicketResponseDto {
  return {
    id: t.id ? t.id.toString() : (t._id as unknown as { toString?: () => string })?.toString?.() ?? '',
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    createdBy: t.createdBy,
    assignedTo: t.assignedTo,
    orderId: t.orderId,
    createdAt: (t.createdAt as Date | undefined),
    updatedAt: (t.updatedAt as Date | undefined),
  };
}
