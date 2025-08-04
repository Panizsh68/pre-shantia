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
    default: '',
  })
  @IsString()
  firstName?: string = '';

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Hosseini',
    default: '',
  })
  @IsString()
  lastName?: string = '';

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
  @IsString()
  address?: string = '';

  @ApiProperty({
    description: 'National ID of the user',
    example: '1234567890',
  })
  @IsNotEmpty()
  @IsString()
  nationalId: string;


  @ApiProperty({
    description: 'List of order IDs associated with the user',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
    default: [],
  })
  @IsArray()
  @IsString({ each: true })
  orders?: string[] = [];

  @ApiProperty({
    description: 'List of transaction IDs associated with the user',
    example: ['507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014'],
    type: [String],
    default: [],
  })
  @IsArray()
  @IsString({ each: true })
  transactions?: string[] = [];

  @ApiProperty({
    description: 'List of favorite product IDs',
    example: ['507f1f77bcf86cd799439015', '507f1f77bcf86cd799439016'],
    type: [String],
    default: [],
  })
  @IsArray()
  @IsString({ each: true })
  favorites?: string[] = [];

  @ApiProperty({
    description: 'ObjectId of user’s shopping cart',
    type: String,
    example: '60f6c0c3d3b5e20017a0a3c2',
    required: false,
  })
  @IsString()
  @IsOptional()
  cart?: string;
}
