import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { VendorRequestStatus } from '../enums/vendor-request-status.enum';

export class ReviewVendorRequestDto {
  @ApiProperty({ enum: [VendorRequestStatus.APPROVED, VendorRequestStatus.REJECTED] })
  @IsIn([VendorRequestStatus.APPROVED, VendorRequestStatus.REJECTED])
  status: VendorRequestStatus.APPROVED | VendorRequestStatus.REJECTED;

  @ApiPropertyOptional({ description: 'Reason shown to the applicant when rejected' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}
