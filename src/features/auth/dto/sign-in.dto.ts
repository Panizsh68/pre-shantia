import { IsNotEmpty, IsPhoneNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { normalizeIranianPhone } from 'src/common/utils/iranian-identifiers';

export class SignInDto {
  @ApiProperty({
    description: 'Iranian phone number of the user',
    example: '+09123456789',
  })
  @Transform(({ value }) => normalizeIranianPhone(String(value ?? '')))
  @IsNotEmpty()
  @IsPhoneNumber('IR')
  phoneNumber: string;
}
