import { IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WalletOwnerType } from '../enums/wallet-ownertype.enum';

export class CreditWalletDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the wallet owner',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  ownerId: string;

  @ApiProperty({
    description: 'Amount to credit to the wallet (in IRR)',
    example: 100000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  ownerType: WalletOwnerType;
}

export class CreditWalletRequestDto {
  @ApiProperty({ description: 'Amount to credit (IRR)', example: 100000, minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;
}
