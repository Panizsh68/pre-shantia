import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsMongoId, IsString } from "class-validator";

export class SendPollDto {
    @ApiProperty()
    @IsString()
    @IsMongoId()
    chat_id: string;

    @ApiProperty()
    @IsString()
    question: string;

    @ApiProperty()
    @IsString()
    @IsArray({ each: true })
    options: string[];
}