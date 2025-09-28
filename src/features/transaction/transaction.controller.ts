import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TokenPayload } from '../auth/interfaces/token-payload.interface';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Transaction } from './schema/transaction.schema';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../permissions/guard/permission.guard';
import { Permission } from '../permissions/decorators/permissions.decorators';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';

@Controller('transaction')
export class TransactionController {
  constructor(@Inject('ITransactionsService') private readonly transactionService: TransactionService) {}

  @Get()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TRANSACTION, Action.READ)
  @ApiOperation({ summary: 'Get transaction history for current user' })
  @ApiOkResponse({
    description: 'List of user transactions returned successfully',
    type: [Transaction], 
  })
  async getTransactionHistory(@CurrentUser() user: TokenPayload) {
    return this.transactionService.findAllByProfile(user.userId);
  }
}
