import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateTransportingDto {
    @ApiProperty({ example: "DHL Express" })
    @IsNotEmpty()
    @IsString()
    carrier: string;
  
    @ApiProperty({ example: "123456789" })
    @IsNotEmpty()
    @IsString()
    trackingNumber: string;
  
    @ApiProperty({ example: "Shipped" })
    @IsOptional()
    @IsString()
    status?: string;
  }