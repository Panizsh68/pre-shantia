import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsIdentityCard, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from "class-validator";

export class CreateCompanyDto {
    @ApiProperty({ example: "Tech Innovations Inc." })
    @IsNotEmpty()
    @IsString()
    name: string;
  
    @ApiProperty({ example: "info@techinnovations.com" })
    @IsNotEmpty()
    @IsEmail()
    email: string;
  
    @ApiProperty({ example: "+982123456789" })
    @IsOptional()
    @IsPhoneNumber("IR")
    phone?: string;  // Aligned with schema
  
    @ApiProperty({ example: "1234567890" })
    @IsNotEmpty()
    @IsIdentityCard("IR")
    registrationNumber: string;

    @ApiProperty({ example: "Tehran, Iran" })
    @IsOptional()
    @IsString()
    address?: string;  // Added for alignment

    @ApiProperty({ example: true })
    @IsOptional()
    isActive?: boolean;  // Added for alignment
}
