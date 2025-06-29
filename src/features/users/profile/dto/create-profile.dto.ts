import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsPhoneNumber,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUserDto } from '../../dto/create-user.dto';
import { Cart } from 'src/features/carts/entities/cart.entity';

export class CreateProfileDto extends CreateUserDto {
  @ApiProperty({
    description: 'First name of the user',
    example: 'Ali',
  })
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Hosseini',
  })
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: 'Iranian phone number of the user',
    example: '+989123456789',
  })
  @IsNotEmpty()
  @IsPhoneNumber('IR')
  phoneNumber: string;

  @ApiProperty({
    description: 'Address of the user',
    example: 'Tehran, Valiasr St., No. 123',
  })
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'National ID of the user',
    example: '1234567890',
  })
  @IsNotEmpty()
  @IsString()
  nationalId: string;

  @ApiProperty({
    description: 'Wallet ID associated with the user (optional)',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsString()
  @IsOptional()
  walletId?: string;

  @ApiProperty({
    description: 'List of order IDs associated with the user',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
    default: [],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  orders?: string[];

  @ApiProperty({
    description: 'List of transaction IDs associated with the user',
    example: ['507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014'],
    type: [String],
    default: [],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  transactions?: string[];

  @ApiProperty({
    description: 'List of favorite product IDs',
    example: ['507f1f77bcf86cd799439015', '507f1f77bcf86cd799439016'],
    type: [String],
    default: [],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  favorites?: string[];

  @ApiProperty({
    description: 'User’s shopping cart',
    type: () => Cart,
    default: [],
  })
  @ValidateNested()
  @Type(() => Cart)
  @IsOptional()
  cart?: Cart;
}
