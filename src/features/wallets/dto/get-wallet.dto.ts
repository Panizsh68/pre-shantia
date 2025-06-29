import { IsOptional, IsString } from 'class-validator';
import { WalletOwnerType } from '../enums/wallet-ownertype.enum';

export class GetWalletDto {
  @IsString()
  ownerId: string;

  @IsString()
  @IsOptional()
  ownerType: WalletOwnerType = WalletOwnerType.USER;
}
