import { IsNotEmpty, IsPhoneNumber, IsIdentityCard, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { normalizeIranianPhone, normalizeNationalId } from 'src/common/utils/iranian-identifiers';

export class CreateUserDto {
  @ApiProperty({
    description: 'Iranian phone number of the user',
    example: '+989123456789',
  })
  @Transform(({ value }) => normalizeIranianPhone(String(value ?? '')))
  @IsNotEmpty()
  @IsPhoneNumber('IR')
  phoneNumber: string;

  @ApiProperty({
    description: 'Iranian national ID (meli code)',
    example: '2284280072',
  })
  @Transform(({ value }) => normalizeNationalId(String(value ?? '')))
  @IsNotEmpty()
  @IsIdentityCard('IR')
  @Matches(/^\d{10}$/, { message: 'Invalid Iranian National ID' })
  nationalId: string;
}
