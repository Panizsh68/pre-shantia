import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsString } from "class-validator";

export class RemoveChatDto {
    @ApiProperty()
    @IsString()
    @IsMongoId()
    chat_id: string;
}