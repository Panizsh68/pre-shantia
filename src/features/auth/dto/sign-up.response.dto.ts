import { ApiProperty } from '@nestjs/swagger';
import { AuthResponseProfile, VerifyOtpResponse } from '../interfaces/auth-response.interface';

export class SignUpResponseDto implements VerifyOtpResponse {
  @ApiProperty({ example: '1234567890', description: 'User phone number' })
  phoneNumber: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
    required: false,
  })
  accessToken?: string;

  @ApiProperty({
    example: 'dGhpc2lzYXJlZnJlc2h0b2tlbg==',
    description: 'JWT refresh token',
    required: false,
  })
  refreshToken?: string;

  @ApiProperty({
    description: 'User profile information',
    required: false,
    example: {
      phoneNumber: '09123456789',
      nationalId: '1234567890',
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Main St',
      walletId: '507f1f77bcf86cd799439011'
    }
  })
  profile?: AuthResponseProfile;
}
