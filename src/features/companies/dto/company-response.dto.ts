import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'Tech Innovations Inc.' })
  name: string;

  @ApiProperty({ example: 'info@techinnovations.com' })
  email: string;

  @ApiPropertyOptional({ example: '+982123456789' })
  phone?: string;

  @ApiProperty({ example: '1234567890' })
  registrationNumber: string;

  @ApiPropertyOptional({ example: 'Tehran, Iran' })
  address?: string;

  @ApiProperty({ enum: ['pending', 'active', 'suspended', 'rejected'], example: 'pending' })
  status: string;

  @ApiPropertyOptional({ example: 'https://storage.ariasakht.com/company/uuid_logo.jpg' })
  image?: string;

  @ApiPropertyOptional({ example: '0123456789' })
  nationalId?: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  createdBy: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  updatedBy: string;

  @ApiPropertyOptional({ type: [String] })
  admins?: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
