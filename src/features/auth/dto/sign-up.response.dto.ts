import { ApiProperty } from '@nestjs/swagger';

export class SignUpResponseDto {
  @ApiProperty({ example: '1234567890', description: 'User phone number' })
  phoneNumber: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT access token', required: false })
  accessToken?: string;

  @ApiProperty({ example: 'dGhpc2lzYXJlZnJlc2h0b2tlbg==', description: 'JWT refresh token', required: false })
  refreshToken?: string;
}
