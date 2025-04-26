import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsOptional, IsString } from "class-validator";

export class BanUserDto {
    @ApiProperty()
    @IsString()
    @IsMongoId()
    operator_id: string;

    @ApiProperty()
    @IsString()
    @IsMongoId()
    user_id: string;

    @ApiProperty()
    @IsString()
    @IsMongoId()
    chat_id: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    reason?: string;
}