import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TicketStatus } from '../enums/ticket-status.enum';
import { TicketPriority } from '../enums/ticket-priority.enum';

export class UpdateTicketDto {

    @ApiProperty()
    @IsEnum(TicketStatus)
    @IsOptional()
    status?: TicketStatus;

    @ApiProperty()
    @IsEnum(TicketPriority)
    @IsOptional()
    priority?: TicketPriority;
}
