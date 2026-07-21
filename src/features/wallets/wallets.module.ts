// wallets.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { Wallet, WalletSchema } from './entities/wallet.entity';
import { getModelToken } from '@nestjs/mongoose';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { TransactionModule } from '../transaction/transaction.module';
import { JwtService } from '@nestjs/jwt';
import { PermissionsModule } from 'src/features/permissions/permissions.module';
import { IWalletRepository, WalletRepository } from './repositories/wallet.repository';
import {
  BASE_AGGREGATE_REPOSITORY,
  BASE_TRANSACTION_REPOSITORY,
} from 'src/libs/repository/constants/tokens.constants';
import { GenericRepositoryModule } from 'src/libs/repository/generic-repository.module';
import { UsersModule } from '../users/users.module';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [
    GenericRepositoryModule.forFeature<Wallet>(Wallet.name, Wallet, WalletSchema),
    TransactionModule,
    forwardRef(() => PermissionsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => CompaniesModule),
  ],
  controllers: [WalletsController],
  providers: [
    {
      provide: 'WalletRepository',
      useFactory: (walletModel, aggregateRepo, transactionRepo): IWalletRepository =>
        new WalletRepository(walletModel, aggregateRepo, transactionRepo),
      inject: [getModelToken(Wallet.name), BASE_AGGREGATE_REPOSITORY, BASE_TRANSACTION_REPOSITORY],
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
