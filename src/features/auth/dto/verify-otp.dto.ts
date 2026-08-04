import { IsNotEmpty, IsNumberString, Length, IsPhoneNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { normalizeIranianPhone, toEnglishDigits } from 'src/common/utils/iranian-identifiers';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Iranian phone number of the user',
    example: '09123456789',
  })
  @Transform(({ value }) => normalizeIranianPhone(String(value ?? '')))
  @IsNotEmpty()
  @IsPhoneNumber('IR')
  phoneNumber: string;

  @ApiProperty({
    description: 'One-time password (OTP) for verification',
    example: '1234',
  })
  @Transform(({ value }) => toEnglishDigits(String(value ?? '')))
  @IsNotEmpty()
  @Length(4, 4)
  @IsNumberString()
  otp: string;
}
