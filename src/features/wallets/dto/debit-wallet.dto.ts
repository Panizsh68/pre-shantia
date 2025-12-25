import { IsString, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WalletOwnerType } from '../enums/wallet-ownertype.enum';

export class DebitWalletDto {
  @ApiProperty({
    description: 'Owner id (must match authenticated user/company/intermediary)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  ownerId: string;

  @ApiProperty({
    description: 'Owner type inferred from permissions; must match authenticated owner type',
    enum: WalletOwnerType,
    example: WalletOwnerType.USER,
  })
  @IsString()
  ownerType: WalletOwnerType;

  @ApiProperty({ description: 'Amount to debit (IRR)', example: 50000 })
  @IsNumber()
  @IsPositive()
  amount: number;
}

export class DebitWalletRequestDto {
  @ApiProperty({ description: 'Amount to debit (IRR)', example: 50000 })
  @IsNumber()
  @IsPositive()
  amount: number;
}

export class TransferWalletRequestDto {
  @ApiProperty({
    description: 'Destination ownerId (users can only send to intermediary)',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  toOwnerId: string;

  @ApiProperty({
    description: 'Destination ownerType; optional for users (defaults to intermediary)',
    enum: WalletOwnerType,
    required: false,
    example: WalletOwnerType.INTERMEDIARY,
  })
  toOwnerType?: WalletOwnerType;

  @ApiProperty({ description: 'Amount to transfer (IRR)', example: 1000 })
  @IsNumber()
  @IsPositive()
  amount: number;
}
