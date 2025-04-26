import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsOptional, IsString } from "class-validator";

export class SendMessageDto {
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
    message: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    @IsMongoId()
    reply_id?: string;
}