import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsString } from "class-validator";

export class EditMessageDto {
    @ApiProperty()
    @IsString()
    @IsMongoId()
    message_id: string;

    @ApiProperty()
    @IsString()
    new_message: string;
}