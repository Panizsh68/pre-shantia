import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';
import { CreateCompanyDto } from './create-company.dto';

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {
  @ApiProperty({
    description: 'MongoDB ObjectId of the company',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  id: string;
}
