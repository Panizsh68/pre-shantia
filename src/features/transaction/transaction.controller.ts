import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateTransactionDto } from './dtos/create-transaction.dto';
import { Transaction } from './schema/transaction.schema';
import { TransactionService } from './transaction.service';
import { ZarinpalService } from 'src/utils/services/zarinpal/zarinpal.service';
import { GetTransactionsZarinpalDto } from 'src/utils/services/zarinpal/dtos/get.zarinpal.transaction.dto';
import {
  InquireZarinpalTransactionDto,
  InquireZarinpalTransactionResponseDto,
  GetTransactionsZarinpalResponseDto,
} from 'src/utils/services/zarinpal/dtos';

@Controller('transaction')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly zarinpalService: ZarinpalService,
  ) {}

  @Post()
  async create(@Body() createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const transaction = await this.transactionService.create(createTransactionDto);
    return transaction;
  }
  @Post('inquire')
  async inquire(
    @Body() inquireTransactionsDto: InquireZarinpalTransactionDto,
  ): Promise<InquireZarinpalTransactionResponseDto> {
    const response = await this.zarinpalService.inquireTransaction(inquireTransactionsDto);
    return response;
  }

  @Get()
  async findAll(
    @Query() getTransactionsDto: GetTransactionsZarinpalDto,
  ): Promise<GetTransactionsZarinpalResponseDto> {
    const response = await this.zarinpalService.getTransactions(getTransactionsDto);
    return response;
  }
}
