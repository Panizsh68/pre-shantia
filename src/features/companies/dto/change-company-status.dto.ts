import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { CompanyStatus } from '../enums/status.enum';

export class ChangeCompanyStatusDto {
  @ApiProperty({ enum: CompanyStatus })
  @IsEnum(CompanyStatus)
  status: CompanyStatus;
}
