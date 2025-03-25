import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsPhoneNumber } from "class-validator";

export class SignInDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsPhoneNumber('IR')
    phoneNumber: string
}