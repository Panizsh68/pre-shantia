import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AuthenticationGuard } from '../users/auth/guards/auth.guard';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @UseGuards(AuthenticationGuard)
  async getTransactions(@Req() req: any) {
    const userId = req.user.userId;
    return this.transactionsService.getTransactions(userId);
  }
}
