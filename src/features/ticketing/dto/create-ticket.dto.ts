import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { TicketPriority } from "../enums/ticket-priority.enum";
import { ApiProperty } from "@nestjs/swagger";
import { TicketStatus } from "../enums/ticket-status.enum";

export class CreateTicketDto {
    @ApiProperty()
    @IsNotEmpty({ message: 'Title is empty' })
    @IsString({ message: 'Title must be a string' })
    title: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Description is empty' })
    @IsString({ message: 'Description must be a string' })
    description: string;

    @ApiProperty({ enum: TicketStatus, default: TicketStatus.Open }) 
    @IsEnum(TicketStatus)
    @IsOptional()
    status?: TicketStatus = TicketStatus.Open; 

    @ApiProperty({ enum: TicketPriority, default: TicketPriority.Low })
    @IsEnum(TicketPriority)
    @IsOptional()
    priority?: TicketPriority = TicketPriority.Low;

    @ApiProperty()
    @IsOptional()
    @IsString()
    createdBy?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    assignedTo?: string;
}
