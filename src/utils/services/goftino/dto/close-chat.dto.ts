import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString } from 'class-validator';

export class CloseChatDto {
    @ApiProperty()
    @IsString()
    @IsMongoId()
    chat_id: string;

    @ApiProperty()
    @IsString()
    @IsMongoId()
    operator_id: string;
}