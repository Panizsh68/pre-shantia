import { IsNotEmpty, IsString, IsOptional, IsEnum, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransportingStatus } from '../enums/transporting.status.enum';

export class CreateTransportingDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the order associated with the shipment',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty()
  @IsMongoId()
  orderId: string;

  @ApiProperty({
    description: 'MongoDB ObjectId of the company handling the shipment',
    example: '507f1f77bcf86cd799439012',
  })
  @IsNotEmpty()
  @IsMongoId()
  companyId: string;

  @ApiProperty({
    description: 'Name of the carrier',
    example: 'DHL Express',
  })
  @IsNotEmpty()
  @IsString()
  carrier: string;

  @ApiProperty({
    description: 'Tracking number for the shipment',
    example: '123456789',
  })
  @IsNotEmpty()
  @IsString()
  trackingNumber: string;

  @ApiPropertyOptional({
    description: 'Status of the shipment',
    enum: TransportingStatus,
    example: TransportingStatus.SHIPPED,
  })
  @IsOptional()
  @IsEnum(TransportingStatus)
  status?: TransportingStatus;

  @ApiPropertyOptional({
    description: 'Estimated delivery date for the shipment',
    example: '2025-06-10',
  })
  @IsOptional()
  estimatedDelivery?: Date;
}
