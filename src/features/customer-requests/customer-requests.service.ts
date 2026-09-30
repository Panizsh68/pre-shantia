import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { ReviewCustomerRequestDto } from './dto/review-customer-request.dto';
import { CustomerRequest } from './entities/customer-request.entity';
import { CustomerRequestStatus } from './enums/customer-request-status.enum';
import { CustomerRequestType } from './enums/customer-request-type.enum';

@Injectable()
export class CustomerRequestsService {
  constructor(@InjectModel(CustomerRequest.name) private readonly requestModel: Model<CustomerRequest>) {}

  async createQuote(dto: CreateQuoteRequestDto, userId: string, type: CustomerRequestType): Promise<CustomerRequest> {
    if (!Types.ObjectId.isValid(userId)) throw new BadRequestException('شناسه کاربر معتبر نیست.');
    const description = dto.description?.trim() || 'درخواست اعلام قیمت و شرایط فروش.';
    return this.requestModel.create({
      type,
      userId,
      title: dto.title.trim(),
      productName: dto.productName.trim(),
      productId: dto.productId,
      quantity: dto.quantity,
      unit: dto.unit.trim(),
      deliveryLocation: dto.deliveryLocation.trim(),
      description,
      status: CustomerRequestStatus.PENDING,
    });
  }

  async createReport(dto: CreateReportDto): Promise<CustomerRequest> {
    return this.requestModel.create({
      type: CustomerRequestType.ABUSE_REPORT,
      title: dto.title.trim(),
      description: dto.description.trim(),
      reporterName: dto.reporterName.trim(),
      reporterEmail: dto.reporterEmail.trim().toLowerCase(),
      targetUrl: dto.targetUrl?.trim(),
      targetReference: dto.targetReference?.trim(),
      status: CustomerRequestStatus.PENDING,
    });
  }

  async listMine(userId: string, type?: CustomerRequestType): Promise<CustomerRequest[]> {
    const filter: Record<string, unknown> = { userId };
    if (type) filter.type = type;
    return this.requestModel.find(filter).sort({ createdAt: -1 }).limit(100).exec();
  }

  async findById(id: string): Promise<CustomerRequest> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('شناسه درخواست نامعتبر است.');
    const request = await this.requestModel.findById(id).exec();
    if (!request) throw new NotFoundException('درخواست پیدا نشد.');
    return request;
  }

  async findMineById(id: string, userId: string): Promise<CustomerRequest> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('شناسه درخواست نامعتبر است.');
    const request = await this.requestModel.findOne({ _id: id, userId }).exec();
    if (!request) throw new NotFoundException('درخواست پیدا نشد.');
    return request;
  }

  async listForAdmin(options: {
    type?: CustomerRequestType;
    status?: CustomerRequestStatus;
    page?: number;
    limit?: number;
  } = {}): Promise<{ items: CustomerRequest[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 25));
    const filter: Record<string, unknown> = {};
    if (options.type) filter.type = options.type;
    if (options.status) filter.status = options.status;
    const [items, total] = await Promise.all([
      this.requestModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
      this.requestModel.countDocuments(filter).exec(),
    ]);
    return { items, total, page, limit };
  }

  async review(id: string, dto: ReviewCustomerRequestDto, reviewerId: string): Promise<CustomerRequest> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(reviewerId)) {
      throw new BadRequestException('شناسه درخواست یا کاربر معتبر نیست.');
    }
    if ((dto.status === CustomerRequestStatus.RESPONDED || dto.status === CustomerRequestStatus.REJECTED) && !dto.adminResponse?.trim()) {
      throw new BadRequestException('برای این وضعیت، پاسخ ادمین الزامی است.');
    }
    const update: Record<string, unknown> = {
      status: dto.status,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    };
    if (dto.adminResponse !== undefined) update.adminResponse = dto.adminResponse.trim();
    if (dto.quotedAmount !== undefined) update.quotedAmount = dto.quotedAmount;
    const updated = await this.requestModel.findOneAndUpdate(
      { _id: id, type: { $in: Object.values(CustomerRequestType) } },
      { $set: update },
      { new: true, runValidators: true },
    ).exec();
    if (!updated) throw new ConflictException('درخواست هم‌زمان تغییر کرده یا پیدا نشد.');
    return updated;
  }
}
