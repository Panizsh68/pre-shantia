import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { Model } from 'mongoose';
import { Wallet, WalletSchema } from './entities/wallet.entity';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { TokensModule } from 'src/utils/services/tokens/tokens.module';
import { JwtService } from '@nestjs/jwt';
import { IWalletRepository, WalletRepository } from './repositories/wallet.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]), TokensModule],
  controllers: [WalletsController],
  providers: [
    WalletsService,
    {
      provide: 'WalletRepository',
      useFactory: (walletModel: Model<Wallet>): IWalletRepository => {
        return new WalletRepository(walletModel);
      },
      inject: [getModelToken(Wallet.name)],
    },
    JwtService,
    TokensService,
    {
      provide: 'IWalletsService',
      useClass: WalletsService,
    },
  ],
  exports: ['WalletRepository', 'IWalletsService'],
})
export class WalletsModule {}
