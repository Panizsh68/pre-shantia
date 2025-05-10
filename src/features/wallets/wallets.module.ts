import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { Model } from 'mongoose';
import { Wallet, WalletSchema } from './entities/wallet.entity';
import { WalletRepository } from './repositories/wallet.repository';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { TokensModule } from 'src/utils/services/tokens/tokens.module';
import { JwtService } from '@nestjs/jwt';
import { BaseRepository } from 'src/utils/base.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
    TokensModule,
  ],
  controllers: [WalletsController],
  providers: [
    WalletsService,
    {
      provide: 'WalletRepository',
      useFactory: (walletModel: Model<Wallet>) => {
        return new WalletRepository(walletModel);
      },
      inject: [getModelToken(Wallet.name)],
    },
    JwtService,
    TokensService,
  ],
  exports: ['WalletRepository', WalletsService],
})
export class WalletsModule {}
