import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiProperty({
    description: 'MongoDB ObjectId of the order',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  id: string;

  @ApiProperty({
    description: 'Ticket id if user opened a ticket for this order',
    example: '507f1f77bcf86cd799439099',
    required: false,
  })
  ticketId?: string | null;
}
