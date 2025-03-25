import { ApiProperty } from "@nestjs/swagger";
import { SignUpDto } from "./sign-up.dto";
import { IsNotEmpty, IsNumberString, Length } from "class-validator";

export class VerifyOtpDto extends SignUpDto {
    @ApiProperty()
    @IsNotEmpty()
    @Length(4, 4)
    @IsNumberString()
    otp: string;
}