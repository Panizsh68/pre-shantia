import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsIdentityCard,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ImageMetaDto } from '../../image-upload/dto/create-presign.dto';

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
  registrationNumber: string;

  @ApiPropertyOptional({
    description: 'Address of the company',
    example: 'Tehran, Iran',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'File metadata to request presign url', type: ImageMetaDto })
  @IsOptional()
  imageMeta?: ImageMetaDto;

  @ApiPropertyOptional({
    description: 'National ID (company national identifier)',
    example: '0123456789',
  })
  @IsOptional()
  @IsIdentityCard('IR')
  nationalId?: string;
}
