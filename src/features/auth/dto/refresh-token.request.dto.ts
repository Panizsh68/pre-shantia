import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenRequestDto {
  @ApiProperty({ description: 'Optional refresh token. If omitted, will be read from cookie', required: false })
  refreshToken?: string;
}
