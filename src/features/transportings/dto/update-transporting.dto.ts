import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';
import { CreateTransportingDto } from './create-transporting.dto';

export class UpdateTransportingDto extends PartialType(CreateTransportingDto) {
  @ApiProperty({
    description: 'MongoDB ObjectId of the transporting record',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  id: string;
}
