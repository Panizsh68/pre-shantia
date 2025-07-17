import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber, IsIdentityCard, Matches } from 'class-validator';

export class UserRegisterDto {
  @ApiProperty({
    description: 'Iranian phone number of the user',
    example: '+989123456789',
  })
  @IsNotEmpty()
  @IsPhoneNumber('IR')
  phoneNumber: string;

  @ApiProperty({
    description: 'Iranian national ID (meli code)',
    example: '2284280072',
  })
  @IsNotEmpty()
  @IsIdentityCard('IR')
  @Matches(/^\d{10}$/, { message: 'Invalid Iranian National ID' })
  nationalId: string;
}
