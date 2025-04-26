import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsMongoId } from 'class-validator';

export class SendFileDto {
  @ApiProperty()
  @IsString()
  @IsMongoId()
  chat_id: string;

  @ApiProperty()
  @IsString()
  @IsMongoId()
  operator_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  file_url: string; 

  @ApiProperty()
  @IsString()
  file_size: string; 

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  file_name: string; 

  @ApiProperty()
  @IsString()
  file_duration?: string;
}