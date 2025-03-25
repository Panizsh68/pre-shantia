import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateProductDto {
  @ApiProperty({ example: "Laptop" })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 1500 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: "company123" })
  @IsNotEmpty()
  @IsString()
  companyId: string; // Added for consistency

  @ApiProperty({ example: ["Electronics", "Computers"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[]; // Changed to align with schema

  @ApiProperty({ example: "High-end gaming laptop with RTX 3080." })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: "Mozilla/5.0" })
  @IsOptional()
  @IsString()
  userAgent?: string; // Kept, but should be handled separately if not needed in schema

  @ApiProperty({ example: "192.168.1.1" })
  @IsOptional()
  @IsString()
  ip?: string; // Kept, but should be handled separately if not needed in schema
}
