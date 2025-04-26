import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { CreateUserDto } from "src/features/users/dto/create-user.dto";

export class SignUpDto extends CreateUserDto{

    @ApiProperty()
    @IsOptional()
    @IsString()
    userAgent?: string

    @ApiProperty()
    @IsOptional()
    @IsString()
    ip?: string

    @ApiProperty()
    @IsOptional()
    @IsString()
    otp?: string | undefined
}