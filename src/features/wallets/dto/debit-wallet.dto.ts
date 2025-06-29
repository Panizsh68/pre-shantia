import { IsString, IsNumber, IsPositive } from 'class-validator';
import { WalletOwnerType } from '../enums/wallet-ownertype.enum';

export class DebitWalletDto {
  @IsString()
  ownerId: string;

  @IsString()
  ownerType: WalletOwnerType;

  @IsNumber()
  @IsPositive()
  amount: number;
}
