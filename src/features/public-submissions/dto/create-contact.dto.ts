import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ description: 'Full name of the contact sender', example: 'علی رضایی' })
  @IsNotEmpty({ message: 'نام نمی‌تواند خالی باشد' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email address of the sender', example: 'ali@example.com' })
  @IsNotEmpty({ message: 'ایمیل نمی‌تواند خالی باشد' })
  @IsEmail(undefined, { message: 'ایمیل نامعتبر است' })
  email: string;

  @ApiProperty({ description: 'Message from the visitor', example: 'درخواست استعلام قیمت برای اجرای پروژه دارم.' })
  @IsNotEmpty({ message: 'پیام نمی‌تواند خالی باشد' })
  @IsString()
  message: string;
}
