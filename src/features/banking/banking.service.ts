import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IWalletService } from '../wallets/interfaces/wallet.service.interface';
import { WalletOwnerType } from '../wallets/enums/wallet-ownertype.enum';
import { BankAccount, BankAccountSchema } from './entities/bank-account.entity';
import { WithdrawalRequest, WithdrawalRequestSchema } from './entities/withdrawal-request.entity';
import { BankAccountStatus } from './enums/bank-account-status.enum';
import { WithdrawalStatus } from './enums/withdrawal-status.enum';
import { RegisterBankAccountDto } from './dto/register-bank-account.dto';
import { ReviewBankAccountDto } from './dto/review-bank-account.dto';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { ReviewWithdrawalDto } from './dto/review-withdrawal.dto';

const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
const arabicDigits = '٠١٢٣٤٥٦٧٨٩';

@Injectable()
export class BankingService {
  constructor(
    @InjectModel(BankAccount.name) private readonly bankAccountModel: Model<BankAccount>,
    @InjectModel(WithdrawalRequest.name) private readonly withdrawalModel: Model<WithdrawalRequest>,
    @Inject('IWalletsService') private readonly walletsService: IWalletService,
  ) { }

  private normalizeDigits(value: string): string {
    return value
      .split('')
      .map((character) => {
        const persianIndex = persianDigits.indexOf(character);
        if (persianIndex >= 0) return String(persianIndex);
        const arabicIndex = arabicDigits.indexOf(character);
        return arabicIndex >= 0 ? String(arabicIndex) : character;
      })
      .join('');
  }

  private normalizeCardNumber(value: string): string {
    const cardNumber = this.normalizeDigits(value || '').replace(/[\s-]/g, '');
    if (!/^\d{16}$/.test(cardNumber)) {
      throw new BadRequestException('شماره کارت باید ۱۶ رقم باشد.');
    }

    let sum = 0;
    for (let index = 0; index < 15; index += 1) {
      let digit = Number(cardNumber[index]);
      if (index % 2 === 0) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    if ((10 - (sum % 10)) % 10 !== Number(cardNumber[15])) {
      throw new BadRequestException('شماره کارت معتبر نیست.');
    }
    return cardNumber;
  }

  private normalizeIban(value: string): string {
    let iban = this.normalizeDigits(value || '').replace(/[\s-]/g, '').toUpperCase();
    if (/^\d{24}$/.test(iban)) iban = `IR${iban}`;
    if (!/^IR\d{24}$/.test(iban)) {
      throw new BadRequestException('شماره شبا باید با IR و ۲۴ رقم وارد شود.');
    }

    const rearranged = `${iban.slice(4)}1827${iban.slice(2, 4)}`;
    let remainder = 0;
    for (const character of rearranged) {
      remainder = (remainder * 10 + Number(character)) % 97;
    }
    if (remainder !== 1) {
      throw new BadRequestException('شماره شبا معتبر نیست.');
    }
    return iban;
  }

  private bankAccountResponse(account: BankAccount, includeSensitive = true) {
    const raw = account.toObject ? account.toObject() : account;
    return {
      id: String(raw._id),
      userId: raw.userId,
      accountHolderName: raw.accountHolderName,
      cardNumber: includeSensitive ? raw.cardNumber : this.maskCard(raw.cardNumber),
      cardNumberMasked: this.maskCard(raw.cardNumber),
      iban: includeSensitive ? raw.iban : this.maskIban(raw.iban),
      ibanMasked: this.maskIban(raw.iban),
      bankName: raw.bankName,
      status: raw.status,
      rejectionReason: raw.rejectionReason,
      reviewedBy: raw.reviewedBy,
      reviewedAt: raw.reviewedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  private withdrawalResponse(request: WithdrawalRequest, bankAccount?: BankAccount | null, includeSensitive = false) {
    const raw = request.toObject ? request.toObject() : request;
    return {
      id: String(raw._id),
      userId: raw.userId,
      bankAccountId: raw.bankAccountId,
      amount: raw.amount,
      currency: raw.currency,
      description: raw.description,
      status: raw.status,
      rejectionReason: raw.rejectionReason,
      reviewedBy: raw.reviewedBy,
      reviewedAt: raw.reviewedAt,
      paidAt: raw.paidAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      bankAccount: bankAccount ? this.bankAccountResponse(bankAccount, includeSensitive) : undefined,
    };
  }

  private maskCard(cardNumber: string): string {
    return cardNumber ? `${cardNumber.slice(0, 4)} **** **** ${cardNumber.slice(-4)}` : '—';
  }

  private maskIban(iban: string): string {
    return iban ? `${iban.slice(0, 4)}****************${iban.slice(-4)}` : '—';
  }

  async listMyBankAccounts(userId: string) {
    const accounts = await this.bankAccountModel.find({ userId }).sort({ createdAt: -1 }).exec();
    return accounts.map((account) => this.bankAccountResponse(account));
  }

  async registerBankAccount(userId: string, dto: RegisterBankAccountDto) {
    const cardNumber = this.normalizeCardNumber(dto.cardNumber);
    const iban = this.normalizeIban(dto.iban);
    const accountHolderName = dto.accountHolderName.trim();
    if (accountHolderName.length < 3) {
      throw new BadRequestException('نام صاحب حساب را کامل وارد کنید.');
    }

    const duplicate = await this.bankAccountModel.findOne({
      userId,
      $or: [{ cardNumber }, { iban }],
      status: { $in: [BankAccountStatus.PENDING, BankAccountStatus.APPROVED] },
    }).exec();
    if (duplicate) {
      throw new ConflictException('این حساب بانکی قبلاً ثبت شده یا در انتظار بررسی است.');
    }

    try {
      const account = await this.bankAccountModel.create({
        userId,
        accountHolderName,
        cardNumber,
        iban,
        bankName: dto.bankName?.trim() || undefined,
        status: BankAccountStatus.PENDING,
      });
      return this.bankAccountResponse(account);
    } catch (error) {
      if ((error as { code?: number })?.code === 11000) {
        throw new ConflictException('این شماره کارت یا شبا قبلاً ثبت شده است.');
      }
      throw error;
    }
  }

  async removeMyBankAccount(userId: string, id: string) {
    const account = await this.bankAccountModel.findOne({ _id: id, userId }).exec();
    if (!account) throw new NotFoundException('حساب بانکی پیدا نشد.');
    if (account.status === BankAccountStatus.APPROVED) {
      throw new BadRequestException('حساب تأییدشده را نمی‌توان حذف کرد.');
    }
    await this.bankAccountModel.deleteOne({ _id: id, userId }).exec();
    return { success: true };
  }

  async listBankAccountsForAdmin(status?: BankAccountStatus) {
    const accounts = await this.bankAccountModel
      .find(status ? { status } : {})
      .sort({ createdAt: -1 })
      .limit(500)
      .exec();
    return accounts.map((account) => this.bankAccountResponse(account, true));
  }

  async reviewBankAccount(id: string, adminId: string, dto: ReviewBankAccountDto) {
    if (![BankAccountStatus.APPROVED, BankAccountStatus.REJECTED].includes(dto.status)) {
      throw new BadRequestException('وضعیت بررسی حساب بانکی نامعتبر است.');
    }
    if (dto.status === BankAccountStatus.REJECTED && !dto.rejectionReason?.trim()) {
      throw new BadRequestException('برای رد حساب بانکی، دلیل رد الزامی است.');
    }

    const account = await this.bankAccountModel.findOneAndUpdate(
      { _id: id, status: BankAccountStatus.PENDING },
      {
        $set: {
          status: dto.status,
          rejectionReason: dto.status === BankAccountStatus.REJECTED ? dto.rejectionReason?.trim() : undefined,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      },
      { new: true },
    ).exec();
    if (!account) throw new NotFoundException('حساب بانکی پیدا نشد یا قبلاً بررسی شده است.');
    return this.bankAccountResponse(account, false);
  }

  async listMyWithdrawals(userId: string) {
    const requests = await this.withdrawalModel.find({ userId }).sort({ createdAt: -1 }).limit(100).exec();
    const accountIds = [...new Set(requests.map((request) => request.bankAccountId))];
    const accounts = await this.bankAccountModel.find({ _id: { $in: accountIds } }).exec();
    const byId = new Map(accounts.map((account) => [String(account._id), account]));
    return requests.map((request) => this.withdrawalResponse(request, byId.get(request.bankAccountId)));
  }

  async createWithdrawal(userId: string, dto: CreateWithdrawalDto) {
    const account = await this.bankAccountModel.findOne({
      _id: dto.bankAccountId,
      userId,
      status: BankAccountStatus.APPROVED,
    }).exec();
    if (!account) {
      throw new BadRequestException('برای برداشت، ابتدا یک حساب بانکی تأییدشده انتخاب کنید.');
    }
    if (!Number.isInteger(dto.amount) || dto.amount <= 0) {
      throw new BadRequestException('مبلغ برداشت باید یک عدد صحیح بزرگ‌تر از صفر باشد.');
    }

    const requestId = uuidv4();
    const blockCorrelationId = `withdrawal:block:${requestId}`;
    await this.walletsService.blockAmount(
      { ownerId: userId, ownerType: WalletOwnerType.USER },
      dto.amount,
      { reason: 'withdrawal-pending', correlationId: blockCorrelationId },
    );

    try {
      const request = await this.withdrawalModel.create({
        userId,
        bankAccountId: String(account._id),
        amount: dto.amount,
        currency: 'IRR',
        description: dto.description?.trim() || undefined,
        status: WithdrawalStatus.PENDING,
        correlationId: requestId,
      });
      return this.withdrawalResponse(request, account);
    } catch (error) {
      await this.walletsService.releaseBlockedAmountToBalance(
        { ownerId: userId, ownerType: WalletOwnerType.USER },
        dto.amount,
        { reason: 'withdrawal-create-failed', correlationId: `withdrawal:release:${requestId}` },
      ).catch(() => undefined);
      throw error;
    }
  }

  async listWithdrawalsForAdmin(status?: WithdrawalStatus) {
    const requests = await this.withdrawalModel
      .find(status ? { status } : {})
      .sort({ createdAt: -1 })
      .limit(500)
      .exec();
    const accountIds = [...new Set(requests.map((request) => request.bankAccountId))];
    const accounts = await this.bankAccountModel.find({ _id: { $in: accountIds } }).exec();
    const byId = new Map(accounts.map((account) => [String(account._id), account]));
    return requests.map((request) => this.withdrawalResponse(request, byId.get(request.bankAccountId), true));
  }

  async reviewWithdrawal(id: string, adminId: string, dto: ReviewWithdrawalDto) {
    const request = await this.withdrawalModel.findById(id).exec();
    if (!request) throw new NotFoundException('درخواست برداشت پیدا نشد.');

    if (dto.status === WithdrawalStatus.REJECTED) {
      if (request.status !== WithdrawalStatus.PENDING && request.status !== WithdrawalStatus.APPROVED) {
        throw new BadRequestException('این درخواست در وضعیت قابل رد نیست.');
      }
      if (!dto.rejectionReason?.trim()) {
        throw new BadRequestException('برای رد درخواست برداشت، دلیل رد الزامی است.');
      }
      const markedRejected = await this.withdrawalModel.findOneAndUpdate(
        { _id: id, status: { $in: [WithdrawalStatus.PENDING, WithdrawalStatus.APPROVED] } },
        { $set: { status: WithdrawalStatus.REJECTED, rejectionReason: dto.rejectionReason.trim(), reviewedBy: adminId, reviewedAt: new Date() } },
        { new: true },
      ).exec();
      if (!markedRejected) throw new BadRequestException('درخواست برداشت هم‌زمان توسط ادمین دیگری بررسی شد.');
      try {
        await this.walletsService.releaseBlockedAmountToBalance(
          { ownerId: request.userId, ownerType: WalletOwnerType.USER },
          request.amount,
          { reason: 'withdrawal-rejected', correlationId: `withdrawal:release:${id}` },
        );
      } catch (error) {
        await this.withdrawalModel.updateOne({ _id: id, status: WithdrawalStatus.REJECTED }, { $set: { status: request.status } }).exec();
        throw error;
      }
      return this.withdrawalResponse(markedRejected);
    }

    if (dto.status === WithdrawalStatus.APPROVED) {
      if (request.status !== WithdrawalStatus.PENDING) throw new BadRequestException('فقط درخواست در انتظار بررسی قابل تأیید است.');
      const approved = await this.withdrawalModel.findOneAndUpdate(
        { _id: id, status: WithdrawalStatus.PENDING },
        { $set: { status: WithdrawalStatus.APPROVED, reviewedBy: adminId, reviewedAt: new Date(), rejectionReason: undefined } },
        { new: true },
      ).exec();
      if (!approved) throw new BadRequestException('درخواست برداشت هم‌زمان توسط ادمین دیگری بررسی شد.');
      return this.withdrawalResponse(approved);
    }

    if (dto.status === WithdrawalStatus.PAID) {
      if (request.status !== WithdrawalStatus.APPROVED) throw new BadRequestException('فقط درخواست تأییدشده قابل ثبت به‌عنوان پرداخت‌شده است.');
      await this.walletsService.settleBlockedAmount(
        { ownerId: request.userId, ownerType: WalletOwnerType.USER },
        request.amount,
        { reason: 'withdrawal-paid', correlationId: `withdrawal:settle:${id}` },
      );
      const paid = await this.withdrawalModel.findOneAndUpdate(
        { _id: id, status: WithdrawalStatus.APPROVED },
        { $set: { status: WithdrawalStatus.PAID, paidAt: new Date(), reviewedBy: adminId, reviewedAt: new Date() } },
        { new: true },
      ).exec();
      if (!paid) throw new BadRequestException('وضعیت پرداخت هم‌زمان تغییر کرده است؛ موجودی دوباره کسر نمی‌شود.');
      return this.withdrawalResponse(paid);
    }

    throw new BadRequestException('وضعیت درخواست برداشت نامعتبر است.');
  }
}
