import { ApiProperty } from '@nestjs/swagger';

export class SignInResponseDto {
  @ApiProperty({ example: '1234567890', description: 'User phone number' })
  phoneNumber: string;
}
