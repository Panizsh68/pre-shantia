import { Ticket } from '../entities/ticketing.entity';
import { TicketResponseDto } from '../dto/ticket-response.dto';

export function ticketToResponseDto(t: Ticket): TicketResponseDto {
  return {
    id: t.id ? t.id.toString() : (t as any)._id?.toString?.() ?? '',
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    createdBy: t.createdBy,
    assignedTo: t.assignedTo,
    orderId: t.orderId,
    createdAt: (t as any).createdAt,
    updatedAt: (t as any).updatedAt,
  };
}
