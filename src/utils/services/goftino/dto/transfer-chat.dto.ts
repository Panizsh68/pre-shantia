// src/goftino/dto/transfer-chat.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString } from 'class-validator';

export class TransferChatDto {
  @ApiProperty()
  @IsString()
  @IsMongoId()
  chat_id: string;

  @ApiProperty()
  @IsString()
  from_operator: string;

  @ApiProperty()
  @IsString()
  to_operator: string;
}