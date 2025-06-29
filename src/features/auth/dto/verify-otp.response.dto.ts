import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({ example: 'dGhpc2lzYXJlZnJlc2h0b2tlbg==', description: 'JWT refresh token' })
  refreshToken: string;
}
