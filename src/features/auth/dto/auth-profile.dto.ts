import { ApiProperty } from '@nestjs/swagger';

export class AuthProfileDto {
  @ApiProperty({
    description: 'User phone number',
    example: '09123456789'
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'User national ID',
    example: '0123456789'
  })
  nationalId: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    required: false
  })
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false
  })
  lastName?: string;

  @ApiProperty({
    description: 'User address',
    example: '123 Main St',
    required: false
  })
  address?: string;

  @ApiProperty({
    description: 'User wallet ID',
    example: '507f1f77bcf86cd799439011',
    required: false
  })
  walletId?: string;
}
