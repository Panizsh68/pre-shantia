import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TokenPayload } from '../auth/interfaces/token-payload.interface';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Transaction } from './schema/transaction.schema';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { isSuperAdmin } from 'src/common/utils/auth-helpers';

@Controller('transaction')
export class TransactionController {
  constructor(@Inject('ITransactionsService') private readonly transactionService: TransactionService) { }

  @Get()
  @UseGuards(AuthenticationGuard)
  @ApiOperation({ 
    summary: 'Get transaction history',
    description: 'Regular users see only their own transactions. Superadmins see all.'
  })
  @ApiOkResponse({
    description: 'List of transactions returned successfully',
    type: [Transaction],
  })
  async getTransactionHistory(@CurrentUser() user: TokenPayload) {
    // Superadmins can see all transactions
    if (isSuperAdmin(user)) {
      return this.transactionService.findAll();
    }
    // Regular users see only their own transactions
    return this.transactionService.findAllByProfile(user.userId);
  }
}
