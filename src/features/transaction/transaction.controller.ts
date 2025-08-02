import { Controller, Get, Inject } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TokenPayload } from '../auth/interfaces/token-payload.interface';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Transaction } from './schema/transaction.schema';

@Controller('transaction')
export class TransactionController {
  constructor(@Inject('ITransactionsService') private readonly transactionService: TransactionService) {}

  @Get()
  @ApiOperation({ summary: 'Get transaction history for current user' })
  @ApiOkResponse({
    description: 'List of user transactions returned successfully',
    type: [Transaction], 
  })
  async getTransactionHistory(@CurrentUser() user: TokenPayload) {
    return this.transactionService.findAllByProfile(user.userId);
  }
}
