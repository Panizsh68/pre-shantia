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
import { WalletOwnerType } from '../wallets/enums/wallet-ownertype.enum';

describe('PaymentService (unit)', () => {
  let service: PaymentService;
  let sessionObj: any;

  beforeEach(async () => {
    // Fake Zibal SDK adapter (mocked through IZibalService interface)
    const zibalMock: Partial<IZibalService> = {
      createPayment: jest.fn().mockResolvedValue({ trackId: '1533727744287', paymentUrl: 'https://pay.example/1533727744287', raw: {} }),
      verifyPayment: jest.fn().mockResolvedValue({ result: 100, refNumber: 'REF123', amount: 2000, paidAt: new Date(), raw: {} }),
      refund: jest.fn().mockResolvedValue({ result: 1, message: 'refunded' }),
    };

    // reusable session object so tests can assert same-session commit/abort
    sessionObj = { id: 'sess1', endSession: jest.fn() };

    // Transaction service mock
    const transactionMock: Partial<ITransactionService> = {
      startSession: jest.fn().mockResolvedValue(sessionObj),
      create: jest.fn().mockImplementation((dto: CreateTransactionDto) => ({ id: 'tx1', ...dto } as unknown as Transaction)),
      updateByLocalId: jest.fn().mockImplementation((localId: string, updateData: Partial<CreateTransactionDto>) => ({ localId, ...updateData } as unknown as Transaction)),
      findOne: jest.fn().mockResolvedValue({ id: 'tx1', amount: 2000, orderId: 'order1', userId: 'user1', status: 'pending' } as unknown as Transaction),
      findPendingByOrderId: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockImplementation((trackId: string, updateData: Partial<CreateTransactionDto>) => ({ trackId, ...updateData } as unknown as Transaction)),
      commitSession: jest.fn().mockResolvedValue(undefined),
      abortSession: jest.fn().mockResolvedValue(undefined),
    };

    // Wallets service mock
    const walletsMock: Partial<IWalletService> = {
      debitWallet: jest.fn().mockResolvedValue(undefined),
      creditWallet: jest.fn().mockResolvedValue(undefined),
      blockAmount: jest.fn().mockResolvedValue(undefined),
      transfer: jest.fn().mockResolvedValue(undefined),
      getWallet: jest.fn().mockResolvedValue({ ownerId: 'user1', ownerType: WalletOwnerType.USER, currency: 'IRR' }),
    };

    // Orders service mock
    const ordersMock: Partial<IOrdersService> = {
      findById: jest.fn().mockResolvedValue({ id: 'order1', status: OrdersStatus.PENDING, userId: 'user1', totalPrice: 2000 } as any),
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
    const res = await service.initiatePayment('user1', 'order1', 2000);
    expect(res).toHaveProperty('transactionId');
    expect(res).toHaveProperty('paymentUrl');
    const zibal = (service as any).zibalService as IZibalService;
    expect(zibal.createPayment).toHaveBeenCalledWith(expect.objectContaining({ amount: 2000 }));
  });

  it('initiates a wallet top-up using an IRR wallet and persists the gateway trackId', async () => {
    const result = await service.initiateWalletTopUp('user1', WalletOwnerType.USER, 3000);

    expect(result).toEqual(expect.objectContaining({ trackId: '1533727744287', paymentUrl: expect.any(String) }));
    expect((service as any).zibalService.createPayment).toHaveBeenCalledWith(expect.objectContaining({ amount: 3000 }));
    expect((service as any).transactionService.updateByLocalId).toHaveBeenCalledWith(
      expect.any(String),
      { trackId: '1533727744287' },
    );
  });

  it('rejects invalid or manipulated order amounts before contacting Zibal', async () => {
    await expect(service.initiatePayment('user1', 'order1', 2000.5)).rejects.toThrow('Amount mismatch');
    expect((service as any).zibalService.createPayment).not.toHaveBeenCalled();
  });

  it('rejects wallet top-ups at or below the provider minimum', async () => {
    await expect(service.initiateWalletTopUp('user1', WalletOwnerType.USER, 1000)).rejects.toThrow('between 1001 and 499999999');
    expect((service as any).zibalService.createPayment).not.toHaveBeenCalled();
  });

  it('handles callback success: verifies, updates transaction, debits and credits wallets, marks order paid', async () => {
    const updated = await service.handleCallback('1533727744287', '1');
    expect((service as any).transactionService.update).toHaveBeenCalled();
    // debitWallet should not be called for external gateway payments
    expect((service as any).walletsService.debitWallet).not.toHaveBeenCalled();
    expect((service as any).walletsService.creditWallet).toHaveBeenCalled();
    expect((service as any).ordersService.markAsPaid).toHaveBeenCalled();
  });

  it('handles callback verification failure without marking the order paid', async () => {
    // Make verifyPayment return non-100 to simulate verification failure
    const zibal = (service as any).zibalService as unknown as IZibalService;
    (zibal.verifyPayment as jest.Mock).mockResolvedValueOnce({ result: 101 });

    await expect(service.handleCallback('000', '1')).rejects.toThrow();
    expect((service as any).ordersService.markAsPaid).not.toHaveBeenCalled();
  });

  it('marks a cancelled callback failed and leaves the order retryable', async () => {
    await expect(service.handleCallback('1533727744287', '0')).rejects.toThrow('Payment failed');

    expect((service as any).transactionService.update).toHaveBeenCalledWith(
      '1533727744287',
      expect.objectContaining({ status: 'failed' }),
      sessionObj,
    );
    expect((service as any).ordersService.markAsPaid).not.toHaveBeenCalled();
  });

  it('keeps the transaction pending when Zibal verification is unavailable', async () => {
    const zibal = (service as any).zibalService as unknown as IZibalService;
    (zibal.verifyPayment as jest.Mock).mockRejectedValueOnce(new Error('gateway timeout'));

    await expect(service.handleCallback('1533727744287', '1')).rejects.toThrow('temporarily unavailable');

    expect((service as any).transactionService.abortSession).toHaveBeenCalledWith(sessionObj);
    expect((service as any).transactionService.update).not.toHaveBeenCalled();
    expect((service as any).walletsService.creditWallet).not.toHaveBeenCalled();
  });

  it('accepts an already-verified Zibal trackId without double-crediting', async () => {
    const zibal = (service as any).zibalService as unknown as IZibalService;
    (zibal.verifyPayment as jest.Mock).mockResolvedValueOnce({ result: 201 });

    await service.handleCallback('1533727744287', '1');

    expect((service as any).walletsService.creditWallet).toHaveBeenCalledTimes(1);
    expect((service as any).ordersService.markAsPaid).toHaveBeenCalledTimes(1);
  });

  it('credits the authenticated wallet exactly once after a verified wallet callback', async () => {
    const txService = (service as any).transactionService;
    txService.findOne = jest.fn().mockResolvedValue({
      id: 'wallet-tx', amount: 3000, status: 'pending', userId: 'user1',
      metadata: { kind: 'wallet_top_up', walletOwnerId: 'user1', walletOwnerType: WalletOwnerType.USER },
    });
    const zibal = (service as any).zibalService as unknown as IZibalService;
    (zibal.verifyPayment as jest.Mock).mockResolvedValueOnce({ result: 100, amount: 3000 });

    await service.handleCallback('1533727744287', '1');

    expect((service as any).walletsService.creditWallet).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: 'user1', amount: 3000, correlationId: 'zibal-wallet-top-up:1533727744287' }),
      sessionObj,
    );
    expect((service as any).ordersService.markAsPaid).not.toHaveBeenCalled();
  });

  it('reuses an existing pending order payment instead of creating another gateway session', async () => {
    const txService = (service as any).transactionService;
    txService.findPendingByOrderId = jest.fn().mockResolvedValue({
      id: 'existing-tx', localId: 'existing-local', trackId: '1533727744287', status: 'pending',
    });

    const result = await service.initiatePayment('user1', 'order1', 2000);

    expect(result.trackId).toBe('1533727744287');
    expect((service as any).zibalService.createPayment).not.toHaveBeenCalled();
    expect(txService.create).not.toHaveBeenCalled();
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
    txService.findOne = jest.fn().mockResolvedValue({ id: 'tx1', status: require('../transaction/enums/transaction.status.enum').TransactionStatus.PENDING, amount: 2000, orderId: 'order1', userId: 'user1' });

    const wallets = (service as any).walletsService;
    wallets.creditWallet = jest.fn().mockRejectedValue(new Error('credit failed'));

    await expect(service.handleCallback('1533727744287', '1')).rejects.toThrow('Payment processing failed');

    expect(txService.abortSession).toHaveBeenCalledWith(sessionObj);
    expect(wallets.creditWallet).toHaveBeenCalled();
    expect(sessionObj.endSession).toHaveBeenCalled();
  });
});
