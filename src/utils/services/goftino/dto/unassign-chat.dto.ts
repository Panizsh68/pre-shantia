import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsString } from "class-validator";

export class UnassignChatDto {
    @ApiProperty()
    @IsString()
    @IsMongoId()
    chat_id: string;
}