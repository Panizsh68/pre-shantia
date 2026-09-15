import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PublicSubmission, PublicSubmissionType } from './entities/public-submission.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateVendorRequestDto } from './dto/create-vendor-request.dto';
import { VendorRequestStatus } from './enums/vendor-request-status.enum';
import { SellerType } from '../companies/enums/seller-type.enum';
import { ICompanyRepository } from '../companies/repositories/company.repository';
import { IProfileRepository } from '../users/profile/repositories/profille.repository';
import { CompanyStatus } from '../companies/enums/status.enum';

@Injectable()
export class PublicSubmissionsService {
  constructor(
    @InjectModel(PublicSubmission.name)
    private readonly submissionModel: Model<PublicSubmission>,
    @Inject('CompanyRepository')
    private readonly companyRepository: ICompanyRepository,
    @Inject('ProfileRepository')
    private readonly profileRepository: IProfileRepository,
  ) {}

  async createContact(dto: CreateContactDto): Promise<PublicSubmission> {
    return this.submissionModel.create({
      type: PublicSubmissionType.Contact,
      name: dto.name,
      email: dto.email,
      message: dto.message,
    });
  }

  async createVendorRequest(dto: CreateVendorRequestDto, userId?: string): Promise<PublicSubmission> {
    this.validateVendorRequest(dto);

    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('شناسه کاربر معتبر نیست.');
      }

      const profile = await this.profileRepository.findOneByCondition({ userId });
      if (profile?.companyId) {
        const linkedCompanyId = profile.companyId.toString();
        const linkedCompany = Types.ObjectId.isValid(linkedCompanyId)
          ? await this.companyRepository.findById(linkedCompanyId)
          : null;
        if (linkedCompany) {
          throw new ConflictException('برای این حساب قبلاً شرکت ثبت شده است.');
        }

        // A deleted company can leave an old profile link behind. Clear only
        // that stale link so the user can submit a new request safely.
        await this.profileRepository.updateOneByCondition(
          { userId, companyId: profile.companyId } as any,
          { $unset: { companyId: 1 } },
        );
      }

      const pending = await this.submissionModel
        .findOne({
          type: PublicSubmissionType.VendorRequest,
          userId,
          $or: this.pendingStatusClauses(),
        })
        .sort({ createdAt: -1 })
        .exec();
      if (pending) return pending;
    }

    return this.submissionModel.create({
      type: PublicSubmissionType.VendorRequest,
      userId,
      companyName: dto.companyName.trim(),
      sellerType: dto.sellerType || SellerType.LEGAL,
      email: dto.email.trim(),
      phone: dto.phone?.trim(),
      registrationNumber: dto.registrationNumber?.trim(),
      nationalId: dto.nationalId?.trim(),
      address: dto.address?.trim(),
      imageUrl: dto.imageUrl?.trim(),
      status: VendorRequestStatus.PENDING,
    });
  }

  async getMyVendorRequests(userId: string): Promise<PublicSubmission[]> {
    const requests = await this.submissionModel
      .find({ type: PublicSubmissionType.VendorRequest, userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()
      .exec();
    return requests.map((request) => ({
      ...request,
      status: request.status || VendorRequestStatus.PENDING,
    })) as PublicSubmission[];
  }

  async listVendorRequests(options: {
    status?: VendorRequestStatus;
    page?: number;
    limit?: number;
  } = {}): Promise<{ items: PublicSubmission[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 25));
    const filter: Record<string, unknown> = {
      type: PublicSubmissionType.VendorRequest,
    };
    if (options.status === VendorRequestStatus.PENDING) {
      filter.$or = this.pendingStatusClauses();
    } else if (options.status) {
      filter.status = options.status;
    }

    const [items, total] = await Promise.all([
      this.submissionModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean().exec(),
      this.submissionModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((request) => ({
        ...request,
        status: request.status || VendorRequestStatus.PENDING,
      })) as PublicSubmission[],
      total,
      page,
      limit,
    };
  }

  async reviewVendorRequest(
    id: string,
    status: VendorRequestStatus.APPROVED | VendorRequestStatus.REJECTED,
    reviewerUserId: string,
    rejectionReason?: string,
  ): Promise<PublicSubmission> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(reviewerUserId)) {
      throw new BadRequestException('شناسه درخواست یا کاربر معتبر نیست.');
    }
    if (![VendorRequestStatus.APPROVED, VendorRequestStatus.REJECTED].includes(status)) {
      throw new BadRequestException('وضعیت بررسی درخواست نامعتبر است.');
    }

    const existing = await this.submissionModel.findById(id).exec();
    if (!existing || existing.type !== PublicSubmissionType.VendorRequest) {
      throw new NotFoundException('درخواست فروشندگی پیدا نشد.');
    }

    if (existing.status === VendorRequestStatus.APPROVED) {
      if (status === VendorRequestStatus.APPROVED) return existing;
      throw new ConflictException('درخواست تأییدشده قابل رد کردن نیست.');
    }
    if (existing.status === VendorRequestStatus.REJECTED) {
      if (status === VendorRequestStatus.REJECTED) return existing;
      throw new ConflictException('درخواست ردشده باید دوباره توسط کاربر ارسال شود.');
    }

    if (status === VendorRequestStatus.REJECTED) {
      if (!rejectionReason?.trim()) {
        throw new BadRequestException('دلیل رد درخواست الزامی است.');
      }
      const rejected = await this.submissionModel.findOneAndUpdate(
        {
          _id: id,
          type: PublicSubmissionType.VendorRequest,
          $or: this.pendingStatusClauses(),
        },
        {
          $set: {
            status,
            reviewedBy: reviewerUserId,
            reviewedAt: new Date(),
            rejectionReason: rejectionReason?.trim() || undefined,
          },
        },
        { new: true },
      ).lean().exec();
      if (!rejected) throw new ConflictException('وضعیت درخواست هم‌زمان تغییر کرده است.');
      return rejected as PublicSubmission;
    }

    return this.approveVendorRequest(existing, reviewerUserId);
  }

  private async approveVendorRequest(existing: PublicSubmission, reviewerUserId: string): Promise<PublicSubmission> {
    if (!existing.userId) {
      throw new ConflictException('این درخواست عمومی به حساب کاربری متصل نیست؛ متقاضی باید پس از ورود دوباره درخواست دهد.');
    }
    if (!Types.ObjectId.isValid(existing.userId)) {
      throw new ConflictException('حساب متقاضی معتبر نیست.');
    }

    const profile = await this.profileRepository.findOneByCondition({ userId: existing.userId });
    if (!profile) throw new ConflictException('پروفایل متقاضی پیدا نشد.');
    if (profile.companyId) throw new ConflictException('این حساب قبلاً به یک شرکت متصل شده است.');

    const registrationNumber = this.registrationNumberFor(existing);
    const session = await this.companyRepository.startTransaction();

    try {
      const company = await this.companyRepository.createOne({
        name: existing.companyName!.trim(),
        sellerType: existing.sellerType || SellerType.LEGAL,
        email: existing.email,
        phone: existing.phone,
        registrationNumber,
        nationalId: existing.nationalId,
        address: existing.address,
        image: this.safeImageUrl(existing.imageUrl),
        status: CompanyStatus.ACTIVE,
        createdBy: new Types.ObjectId(existing.userId),
        updatedBy: new Types.ObjectId(reviewerUserId),
        admins: [new Types.ObjectId(existing.userId)],
      }, session);

      await this.profileRepository.updateOneByCondition(
        {
          _id: profile._id,
          $or: [{ companyId: { $exists: false } }, { companyId: null }],
        } as any,
        { companyId: company._id },
        { session },
      );

      const approved = await this.submissionModel.findOneAndUpdate(
        {
          _id: existing._id,
          type: PublicSubmissionType.VendorRequest,
          $or: this.pendingStatusClauses(),
        },
        {
          $set: {
            status: VendorRequestStatus.APPROVED,
            reviewedBy: reviewerUserId,
            reviewedAt: new Date(),
            companyId: company._id,
          },
        },
        { new: true, session },
      ).lean().exec();

      if (!approved) throw new ConflictException('وضعیت درخواست هم‌زمان تغییر کرده است.');

      await this.companyRepository.commitTransaction(session);
      return approved as PublicSubmission;
    } catch (error) {
      await this.companyRepository.abortTransaction(session);
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('نام، ایمیل یا شماره ثبت این شرکت قبلاً استفاده شده است.');
      }
      throw error;
    }
  }

  private pendingStatusClauses() {
    // Older vendor requests were stored before the status field existed.
    // Treat missing/null status as pending so they remain reviewable.
    return [
      { status: VendorRequestStatus.PENDING },
      { status: { $exists: false } },
      { status: null },
    ];
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return Boolean(
      error
      && typeof error === 'object'
      && 'code' in error
      && (error as { code?: unknown }).code === 11000,
    );
  }

  private validateVendorRequest(dto: CreateVendorRequestDto): void {
    const sellerType = dto.sellerType || SellerType.LEGAL;
    const registrationNumber = dto.registrationNumber?.trim();
    const nationalId = dto.nationalId?.trim();

    if (sellerType === SellerType.LEGAL && !registrationNumber) {
      throw new BadRequestException('شماره ثبت برای شخص حقوقی الزامی است.');
    }
    if (sellerType === SellerType.INDIVIDUAL && !nationalId) {
      throw new BadRequestException('کد ملی برای شخص حقیقی الزامی است.');
    }
    if (registrationNumber && !/^[0-9۰-۹]{3,20}$/.test(registrationNumber)) {
      throw new BadRequestException('شماره ثبت نامعتبر است.');
    }
    if (nationalId && !/^[0-9۰-۹]{10}$/.test(nationalId)) {
      throw new BadRequestException('شناسه ملی یا کد ملی باید ۱۰ رقم باشد.');
    }
  }

  private registrationNumberFor(request: PublicSubmission): string {
    if (request.sellerType !== SellerType.INDIVIDUAL) {
      if (!request.registrationNumber) throw new BadRequestException('شماره ثبت برای شخص حقوقی الزامی است.');
      return request.registrationNumber.trim();
    }

    if (!request.nationalId) throw new BadRequestException('کد ملی برای شخص حقیقی الزامی است.');
    const normalized = request.nationalId.replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776));
    return `IND-${normalized}`;
  }

  private safeImageUrl(value?: string): string | undefined {
    return value && /^https?:\/\//i.test(value) && value.length <= 2048 ? value : undefined;
  }
}
