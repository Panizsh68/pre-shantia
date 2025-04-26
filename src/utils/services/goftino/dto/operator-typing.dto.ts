import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsMongoId, IsString } from "class-validator";

export class OperatorTypingDto {
    @ApiProperty()
    @IsString()
    @IsMongoId()
    chat_id: string;

    @ApiProperty()
    @IsString()
    @IsMongoId()
    operator_id: string;

    @ApiProperty()
    @IsBoolean()
    typing_status: boolean;
}