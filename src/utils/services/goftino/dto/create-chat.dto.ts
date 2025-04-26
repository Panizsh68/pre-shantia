import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsOptional, IsString } from "class-validator";

export class CreateChatDto {
    @ApiProperty()
    @IsString()
    @IsMongoId()
    user_id: string;

    @ApiProperty()
    @IsString()
    @IsMongoId()
    @IsOptional()
    operator_id?: string;
}