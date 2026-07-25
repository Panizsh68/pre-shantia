import { Controller, Get, Inject, Param, UseGuards, ForbiddenException } from '@nestjs/common';
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
import { isSuperAdmin } from 'src/common/utils/auth-helpers';

@Controller('transaction')
export class TransactionController {
  constructor(@Inject('ITransactionsService') private readonly transactionService: TransactionService) { }

  @Get()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TRANSACTION, Action.READ)
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

  @Get(':trackId')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.TRANSACTION, Action.READ)
  @ApiOperation({ summary: 'Get one transaction status for its owner' })
  async getTransactionStatus(
    @Param('trackId') trackId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    const transaction = await this.transactionService.findOne(trackId);
    if (!isSuperAdmin(user) && transaction.userId !== user.userId) {
      throw new ForbiddenException('You do not own this transaction');
    }
    return transaction;
  }
}
