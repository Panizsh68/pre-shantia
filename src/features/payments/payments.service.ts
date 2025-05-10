import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InitiatePaymentDto } from './dto/initiate-payment';
import { IPaymentRepository } from './repositories/payments.repository';
import { ConfigService } from '@nestjs/config';
import { ZarinpalService } from 'src/utils/services/zarinpal/zarinpal.service';
import { WalletsService } from '../wallets/wallets.service';
import { TransactionsService } from '../transactions/transactions.service';
import { PaymentStatus } from './enums/payment-status.enum';
import { PaymentGateway } from './enums/payment-gateway.enum';
import { ZarinpalCreatePaymentDto } from 'src/utils/services/zarinpal/dto/zpal-create-payment.dto';
import * as mysql from 'mysql2/promise'; 
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { ZarinpalVerifyPaymentDto } from 'src/utils/services/zarinpal/dto/zpal-verify-payment.dto';
import { CreditWalletDto } from '../wallets/dto/credit-wallet.dto';
import { CreateTransactionDto } from '../transactions/dto/create-transaction.dto';
import { PaymentMethod } from './enums/payment-method.enum';
import { TransactionType } from '../transactions/enums/transaction-type.enum';
import { TransactionStatus } from '../transactions/enums/transaction.status.enum';

@Injectable()
export class PaymentsService {
  private readonly pool: mysql.Pool

  constructor(
    @Inject('PaymentRepository') 
    private readonly paymentRepository: IPaymentRepository,
    private readonly zarinpalService: ZarinpalService,
    private readonly walletsService: WalletsService,
    private readonly transactionsService: TransactionsService,
    private readonly configService: ConfigService,
  ) {
    this.pool = mysql.createPool({
      host: this.configService.get('MYSQL.HOST'),
      user: this.configService.get('MYSQL.USER'),
      password: this.configService.get('MYSQL.PASSWORD'),
      database: this.configService.get('MYSQL.DATABASE'),
    });
  }

  async initiatePayment(initiatePaymentDto: InitiatePaymentDto) {
    const payment = await this.paymentRepository.create({
      status: PaymentStatus.PENDING,
      gateway: PaymentGateway.ZARINPAL,
      method: PaymentMethod.GATEWAY,
      userId: initiatePaymentDto.userId,
      currency: initiatePaymentDto.currency,
      amount: initiatePaymentDto.amount,
      orderId: initiatePaymentDto.orderId,
      companyId: initiatePaymentDto.companyId,
    })
    const ZarinpalCreatePaymentDto: ZarinpalCreatePaymentDto = {
      amount: initiatePaymentDto.amount, 
      paymentId: payment._id, 
      currency: initiatePaymentDto.currency
    }

    const zarinpalResponse = await this.zarinpalService.createPayment(ZarinpalCreatePaymentDto);
    payment.gatewayTransactionId = zarinpalResponse.authority
    return payment
  }

  async verifyPayment(verifyPaymentDto: VerifyPaymentDto) {
    const [rows] = await this.pool.query('SELECT * FROM zpnode_payments WHERE authority = ?', [verifyPaymentDto.authority])
    
    const zpnodePayment = rows[0]


    const payment = await this.paymentRepository.findOne(zpnodePayment.payment_id)
    if (!payment) throw new NotFoundException

    const verfiyDtoResult: ZarinpalVerifyPaymentDto = {
      authority: verifyPaymentDto.authority,
      amount: payment.amount
    }
    const verifyResult = await this.zarinpalService.verifyPayment(verfiyDtoResult)
    if (verifyResult.status === 'SUCCESS') {
      await this.paymentRepository.update((payment._id).toString(), { status:  PaymentStatus.COMPLETED})
      const creditWalletDto: CreditWalletDto = {
        ownerId: payment.userId,
        amount: payment.amount
      }
      await this.walletsService.creditWallet(creditWalletDto)
      const createTransactionDto: CreateTransactionDto = {
            userId: payment.userId,
            paymentId: payment._id,
            amount: payment.amount,
            type: TransactionType.CREDIT,
            status: TransactionStatus.COMPLETED,
      }
      await this.transactionsService.create(createTransactionDto);

      await this.pool.query('UPDATE zpnode_payments SET status = ? WHERE authority = ?', ['COMPLETED', verifyPaymentDto.authority]);
    }
    return payment;
  }
}
