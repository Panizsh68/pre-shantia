import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletsModule } from '../wallets/wallets.module';
import { BankAccount, BankAccountSchema } from './entities/bank-account.entity';
import { WithdrawalRequest, WithdrawalRequestSchema } from './entities/withdrawal-request.entity';
import { BankingController } from './banking.controller';
import { BankingService } from './banking.service';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BankAccount.name, schema: BankAccountSchema },
      { name: WithdrawalRequest.name, schema: WithdrawalRequestSchema },
    ]),
    forwardRef(() => WalletsModule),
    forwardRef(() => PermissionsModule),
  ],
  controllers: [BankingController],
  providers: [BankingService],
})
export class BankingModule { }
