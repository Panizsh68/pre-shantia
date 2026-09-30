import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, ValidateIf } from 'class-validator';
import { CustomerRequestStatus } from '../enums/customer-request-status.enum';

export class ReviewCustomerRequestDto {
  @ApiProperty({ enum: CustomerRequestStatus })
  @IsEnum(CustomerRequestStatus, { message: 'وضعیت درخواست نامعتبر است.' })
  status: CustomerRequestStatus;

  @ApiPropertyOptional({ example: 'قیمت نهایی پس از بررسی تأمین‌کنندگان اعلام شد.' })
  @ValidateIf((request) => request.status === CustomerRequestStatus.RESPONDED || request.status === CustomerRequestStatus.REJECTED)
  @IsString({ message: 'پاسخ ادمین نامعتبر است.' })
  @MaxLength(4000)
  adminResponse?: string;

  @ApiPropertyOptional({ example: 125000000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'قیمت باید عدد صحیح باشد.' })
  @Min(0, { message: 'قیمت نمی‌تواند منفی باشد.' })
  quotedAmount?: number;
}
