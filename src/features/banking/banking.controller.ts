import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../permissions/guard/permission.guard';
import { Permission } from '../permissions/decorators/permissions.decorators';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { TokenPayload } from '../auth/interfaces/token-payload.interface';
import { BankingService } from './banking.service';
import { RegisterBankAccountDto } from './dto/register-bank-account.dto';
import { ReviewBankAccountDto } from './dto/review-bank-account.dto';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { ReviewWithdrawalDto } from './dto/review-withdrawal.dto';
import { BankAccountStatus } from './enums/bank-account-status.enum';
import { WithdrawalStatus } from './enums/withdrawal-status.enum';

@ApiTags('Banking')
@ApiBearerAuth()
@Controller()
@UseGuards(AuthenticationGuard)
export class BankingController {
  constructor(private readonly bankingService: BankingService) { }

  @Get('bank-accounts')
  @UseGuards(PermissionsGuard)
  @Permission(Resource.WALLETS, Action.READ)
  @ApiOperation({ summary: 'List my bank accounts' })
  listMyBankAccounts(@CurrentUser() user: TokenPayload) {
    return this.bankingService.listMyBankAccounts(user.userId);
  }

  @Post('bank-accounts')
  @UseGuards(PermissionsGuard)
  @Permission(Resource.WALLETS, Action.UPDATE)
  @ApiOperation({ summary: 'Register a bank card and IBAN for withdrawals' })
  registerBankAccount(@CurrentUser() user: TokenPayload, @Body() dto: RegisterBankAccountDto) {
    return this.bankingService.registerBankAccount(user.userId, dto);
  }

  @Delete('bank-accounts/:id')
  @UseGuards(PermissionsGuard)
  @Permission(Resource.WALLETS, Action.UPDATE)
  @ApiOperation({ summary: 'Remove an unapproved bank account' })
  removeMyBankAccount(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.bankingService.removeMyBankAccount(user.userId, id);
  }

  @Get('withdrawals')
  @UseGuards(PermissionsGuard)
  @Permission(Resource.WALLETS, Action.READ)
  @ApiOperation({ summary: 'List my withdrawal requests' })
  listMyWithdrawals(@CurrentUser() user: TokenPayload) {
    return this.bankingService.listMyWithdrawals(user.userId);
  }

  @Post('withdrawals')
  @UseGuards(PermissionsGuard)
  @Permission(Resource.WALLETS, Action.UPDATE)
  @ApiOperation({ summary: 'Create a withdrawal request' })
  createWithdrawal(@CurrentUser() user: TokenPayload, @Body() dto: CreateWithdrawalDto) {
    return this.bankingService.createWithdrawal(user.userId, dto);
  }

  @Get('admin/bank-accounts')
  @UseGuards(PermissionsGuard)
  @Permission(Resource.WALLETS, Action.MANAGE)
  @ApiOperation({ summary: 'List bank accounts for review' })
  listBankAccountsForAdmin(@Query('status') status?: BankAccountStatus) {
    return this.bankingService.listBankAccountsForAdmin(status);
  }

  @Patch('admin/bank-accounts/:id/review')
  @UseGuards(PermissionsGuard)
  @Permission(Resource.WALLETS, Action.MANAGE)
  @ApiOperation({ summary: 'Approve or reject a bank account' })
  reviewBankAccount(@Param('id') id: string, @CurrentUser() user: TokenPayload, @Body() dto: ReviewBankAccountDto) {
    return this.bankingService.reviewBankAccount(id, user.userId, dto);
  }

  @Get('admin/withdrawals')
  @UseGuards(PermissionsGuard)
  @Permission(Resource.WALLETS, Action.MANAGE)
  @ApiOperation({ summary: 'List withdrawal requests for processing' })
  listWithdrawalsForAdmin(@Query('status') status?: WithdrawalStatus) {
    return this.bankingService.listWithdrawalsForAdmin(status);
  }

  @Patch('admin/withdrawals/:id/status')
  @UseGuards(PermissionsGuard)
  @Permission(Resource.WALLETS, Action.MANAGE)
  @ApiOperation({ summary: 'Approve, reject or mark a withdrawal as paid' })
  reviewWithdrawal(@Param('id') id: string, @CurrentUser() user: TokenPayload, @Body() dto: ReviewWithdrawalDto) {
    return this.bankingService.reviewWithdrawal(id, user.userId, dto);
  }
}
