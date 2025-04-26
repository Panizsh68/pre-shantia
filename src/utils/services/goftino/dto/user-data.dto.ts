import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsMongoId, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from "class-validator";

export class UserDataDto {
    @ApiProperty()
    @IsString()
    @IsMongoId()
    user_id: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    @IsPhoneNumber('IR')
    phone?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    @IsEmail()
    email?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    avarar?: string;
}