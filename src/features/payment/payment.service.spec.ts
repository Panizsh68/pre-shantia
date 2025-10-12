import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { IZIBAL_SERVICE } from 'src/utils/services/zibal/constants/zibal.constants';
import { ITransactionService } from '../transaction/interfaces/transaction.service.interface';
import { IWalletService } from '../wallets/interfaces/wallet.service.interface';
import { IOrdersService } from '../orders/interfaces/order.service.interface';
import { IZibalService } from 'src/utils/services/zibal/interfaces/zibal.service.interface';
import { CreateTransactionDto } from '../transaction/dtos/create-transaction.dto';
import { Transaction } from '../transaction/schema/transaction.schema';
import { OrdersStatus } from '../orders/enums/orders.status.enum';

describe('PaymentService (unit)', () => {
  let service: PaymentService;
  let sessionObj: any;

  beforeEach(async () => {
    // Fake Zibal SDK adapter (mocked through IZibalService interface)
    const zibalMock: Partial<IZibalService> = {
      createPayment: jest.fn().mockResolvedValue({ trackId: '1533727744287', paymentUrl: 'https://pay.example/1533727744287', raw: {} }),
      verifyPayment: jest.fn().mockResolvedValue({ result: 100, refNumber: 'REF123', amount: 200, paidAt: new Date(), raw: {} }),
      refund: jest.fn().mockResolvedValue({ result: 1, message: 'refunded' }),
    };

    // reusable session object so tests can assert same-session commit/abort
    sessionObj = { id: 'sess1', endSession: jest.fn() };

    // Transaction service mock
    const transactionMock: Partial<ITransactionService> = {
      startSession: jest.fn().mockResolvedValue(sessionObj),
      create: jest.fn().mockImplementation((dto: CreateTransactionDto) => ({ id: 'tx1', ...dto } as unknown as Transaction)),
      updateByLocalId: jest.fn().mockImplementation((localId: string, updateData: Partial<CreateTransactionDto>) => ({ localId, ...updateData } as unknown as Transaction)),
      findOne: jest.fn().mockResolvedValue({ id: 'tx1', amount: 200, orderId: 'order1', userId: 'user1' } as unknown as Transaction),
      update: jest.fn().mockImplementation((trackId: string, updateData: Partial<CreateTransactionDto>) => ({ trackId, ...updateData } as unknown as Transaction)),
      commitSession: jest.fn().mockResolvedValue(undefined),
      abortSession: jest.fn().mockResolvedValue(undefined),
    };

    // Wallets service mock
    const walletsMock: Partial<IWalletService> = {
      debitWallet: jest.fn().mockResolvedValue(undefined),
      creditWallet: jest.fn().mockResolvedValue(undefined),
      transfer: jest.fn().mockResolvedValue(undefined),
    };

    // Orders service mock
    const ordersMock: Partial<IOrdersService> = {
      findById: jest.fn().mockResolvedValue({ id: 'order1', status: OrdersStatus.PENDING, userId: 'user1' } as any),
      markAsPaid: jest.fn().mockResolvedValue({} as any),
      update: jest.fn().mockResolvedValue({} as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: IZIBAL_SERVICE,
          useValue: zibalMock,
        },
        {
          provide: 'ITransactionsService',
          useValue: transactionMock,
        },
        {
          provide: 'IWalletsService',
          useValue: walletsMock,
        },
        {
          provide: 'IOrdersService',
          useValue: ordersMock,
        },
        {
          provide: require('@nestjs/config').ConfigService,
          useValue: { get: jest.fn().mockReturnValue('https://callback.test') },
        },
        PaymentService,
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('initiates a payment and returns transaction and URL', async () => {
    const res = await service.initiatePayment('user1', 'order1', 200);
    expect(res).toHaveProperty('transactionId');
    expect(res).toHaveProperty('paymentUrl');
    const zibal = (service as any).zibalService as IZibalService;
    expect(zibal.createPayment).toHaveBeenCalledWith(expect.objectContaining({ amount: 200 }));
  });

  it('handles callback success: verifies, updates transaction, debits and credits wallets, marks order paid', async () => {
    const updated = await service.handleCallback('1533727744287', '1');
    expect((service as any).transactionService.update).toHaveBeenCalled();
    // debitWallet should not be called for external gateway payments
    expect((service as any).walletsService.debitWallet).not.toHaveBeenCalled();
    expect((service as any).walletsService.creditWallet).toHaveBeenCalled();
    expect((service as any).ordersService.markAsPaid).toHaveBeenCalled();
  });

  it('handles callback failure: marks order failed and throws', async () => {
    // Make verifyPayment return non-100 to simulate verification failure
    const zibal = (service as any).zibalService as unknown as IZibalService;
    (zibal.verifyPayment as jest.Mock).mockResolvedValueOnce({ result: 101 });

    await expect(service.handleCallback('000', '1')).rejects.toThrow();
  });

  it('commits session and ends session with same object on success', async () => {
    const txService = (service as any).transactionService;

    await service.handleCallback('1533727744287', '1');

    expect(txService.commitSession).toHaveBeenCalledWith(sessionObj);
    expect(sessionObj.endSession).toHaveBeenCalled();
  });

  it('is idempotent: does not debit/credit wallets if transaction already completed', async () => {
    const txService = (service as any).transactionService;
    // Make findOne return a completed transaction
    txService.findOne = jest.fn().mockResolvedValue({ id: 'tx1', status: require('../transaction/enums/transaction.status.enum').TransactionStatus.COMPLETED, amount: 200, orderId: 'order1', userId: 'user1' });
    txService.startSession = jest.fn().mockResolvedValue(sessionObj);

    const res = await service.handleCallback('1533727744287', '1');

    expect((service as any).walletsService.debitWallet).not.toHaveBeenCalled();
    expect((service as any).walletsService.creditWallet).not.toHaveBeenCalled();
    expect(txService.commitSession).toHaveBeenCalledWith(sessionObj);
  });

  it('aborts transaction and does not credit on wallet debit failure', async () => {
    const txService = (service as any).transactionService;
    txService.startSession = jest.fn().mockResolvedValue(sessionObj);
    txService.findOne = jest.fn().mockResolvedValue({ id: 'tx1', status: require('../transaction/enums/transaction.status.enum').TransactionStatus.PENDING, amount: 200, orderId: 'order1', userId: 'user1' });

    const wallets = (service as any).walletsService;
    wallets.creditWallet = jest.fn().mockRejectedValue(new Error('credit failed'));

    await expect(service.handleCallback('1533727744287', '1')).rejects.toThrow('Payment processing failed');

    expect(txService.abortSession).toHaveBeenCalledWith(sessionObj);
    expect(wallets.creditWallet).toHaveBeenCalled();
    expect(sessionObj.endSession).toHaveBeenCalled();
  });
});
