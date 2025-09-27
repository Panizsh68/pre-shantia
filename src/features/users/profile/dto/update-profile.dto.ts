import { PartialType } from '@nestjs/swagger';
import { CreateProfileDto } from './create-profile.dto';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto extends PartialType(CreateProfileDto) {
  @ApiPropertyOptional({
    description: 'Wallet ID for the profile',
    type: String,
  })
  @IsOptional()
  @IsString()
  walletId?: string;

  @ApiPropertyOptional({
    description: 'Company id the user belongs to (optional)',
    type: String,
  })
  @IsOptional()
  @IsString()
  companyId?: string;
}
