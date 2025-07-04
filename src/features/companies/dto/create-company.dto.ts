import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsIdentityCard,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Express } from 'express';

export class CreateCompanyDto {
  @ApiProperty({
    description: 'Name of the company',
    example: 'Tech Innovations Inc.',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Email address of the company',
    example: 'info@techinnovations.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Phone number of the company',
    example: '+982123456789',
  })
  @IsOptional()
  @IsPhoneNumber('IR')
  phone?: string;

  @ApiProperty({
    description: 'Registration number of the company',
    example: '1234567890',
  })
  @IsNotEmpty()
  @IsIdentityCard('IR')
  registrationNumber: string;

  @ApiPropertyOptional({
    description: 'Address of the company',
    example: 'Tehran, Iran',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Active status of the company',
    example: true,
  })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Company logo or image',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  image?: Express.Multer.File;
}
