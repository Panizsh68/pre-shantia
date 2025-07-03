// wallets.module.ts
import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { Wallet, WalletSchema } from './entities/wallet.entity';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { TokensModule } from 'src/utils/services/tokens/tokens.module';
import { JwtService } from '@nestjs/jwt';
import { IWalletRepository, WalletRepository } from './repositories/wallet.repository';
import { RepositoryHelperModule } from 'src/libs/repository/repository-helper.module';
import { BASE_TRANSACTION_REPOSITORY } from 'src/libs/repository/constants/tokens.constants';
import { GenericRepositoryModule } from 'src/libs/repository/generic-repository.module';

@Module({
  imports: [
     GenericRepositoryModule.forFeature<Wallet>(Wallet.name, Wallet, WalletSchema),
  ],
  controllers: [WalletsController],
  providers: [
    {
      provide: 'WalletRepository',
      useFactory: (
        walletModel,
        transactionRepo,
      ): IWalletRepository => new WalletRepository(walletModel, transactionRepo),
      inject: [
        getModelToken(Wallet.name),
        BASE_TRANSACTION_REPOSITORY,
      ],
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
export class WalletsModule { }
