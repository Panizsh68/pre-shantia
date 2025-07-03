import { IsNotEmpty, IsNumberString, Length, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Iranian phone number of the user',
    example: '09123456789',
  })
  @IsNotEmpty()
  @IsPhoneNumber('IR')
  phoneNumber: string;

  @ApiProperty({
    description: 'One-time password (OTP) for verification',
    example: '1234',
  })
  @IsNotEmpty()
  @Length(4, 4)
  @IsNumberString()
  otp: string;
}
