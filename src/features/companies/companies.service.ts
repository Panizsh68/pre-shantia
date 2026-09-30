import { BadRequestException, Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { RedactingLogger } from 'src/infrastructure/logging/redacting-logger';
import { ICompanyRepository } from './repositories/company.repository';
import { Company } from './entities/company.entity';
import { ICompany } from './interfaces/company.interface';
import { ICompanyService } from './interfaces/company.service.interface';
import { CompanyStatus } from './enums/status.enum';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';
import { RequestContext } from 'src/common/types/request-context.interface';
import { Types } from 'mongoose';
import { toPlain, toPlainArray } from 'src/libs/repository/utils/doc-mapper';
import { IImageUploadServiceToken, IImageUploadService } from '../image-upload/interfaces/image-upload.service.interface';
import { CreatePresignDto } from '../image-upload/dto/create-presign.dto';
import { CreatePresignResponseDto } from '../image-upload/dto/presign-response.dto';
import { SellerType } from './enums/seller-type.enum';

@Injectable()
export class CompaniesService implements ICompanyService {
  private readonly logger = new RedactingLogger(CompaniesService.name);

  constructor(
    @Inject('CompanyRepository') private readonly companyRepository: ICompanyRepository,
    @Inject(IImageUploadServiceToken) private readonly imageUploadService?: IImageUploadService,
  ) { }

  async create(
    createCompanyDto: CreateCompanyDto,
    userId: string,
    ctx: RequestContext,
  ): Promise<ICompany> {
    this.logger.log(`[create] ENTRY: userId=${userId}, name=${createCompanyDto.name}`);
    this.logger.debug(`[create] imageMeta provided: ${createCompanyDto.imageMeta ? 'YES' : 'NO'}`);

    const sellerType = createCompanyDto.sellerType;
    const name = this.requiredText(createCompanyDto.name, 'نام شرکت یا نام و نام خانوادگی');
    const email = this.requiredText(createCompanyDto.email, 'ایمیل');
    const phone = this.requiredText(createCompanyDto.phone, 'شماره تماس');
    const address = this.requiredText(createCompanyDto.address, 'آدرس دفتر مرکزی');
    const nationalId = this.requiredText(createCompanyDto.nationalId, 'کد ملی یا شناسه ملی');
    let registrationNumber = createCompanyDto.registrationNumber?.trim();

    if (sellerType === SellerType.LEGAL && !registrationNumber) {
      throw new BadRequestException('شماره ثبت برای شخص حقوقی الزامی است.');
    }
    if (sellerType === SellerType.INDIVIDUAL && !registrationNumber) {
      registrationNumber = `IND-${nationalId}`;
    }

    const providedImage = createCompanyDto.image?.trim();
    if (!providedImage && !createCompanyDto.imageMeta) {
      throw new BadRequestException('لوگوی شرکت الزامی است. ابتدا تصویر را بارگذاری کنید.');
    }

    const data: Partial<Company> = {
      name,
      sellerType,
      email,
      phone,
      address,
      nationalId,
      registrationNumber,
      image: providedImage,
      createdBy: new Types.ObjectId(userId),
      updatedBy: new Types.ObjectId(userId),
      status: CompanyStatus.PENDING,
      admins: [new Types.ObjectId(userId)],
    };

    // Integration: if frontend provides image metadata to be presigned, request presigns and persist public URL
    // Expect createCompanyDto.imageMeta to be { filename, contentType, size }
    const imageMeta = (createCompanyDto as CreateCompanyDto).imageMeta;
    if (imageMeta && this.imageUploadService) {
      this.logger.log(`[create] Image upload requested: ${imageMeta.filename} (${imageMeta.size} bytes)`);
      try {
        const presignPayload: CreatePresignDto = { type: 'company', files: [imageMeta] };
        this.logger.debug(`[create] Calling imageUploadService.createPresignedUrls...`);
        const presignResult: CreatePresignResponseDto = await this.imageUploadService.createPresignedUrls(presignPayload);
        if (presignResult.items && presignResult.items.length > 0) {
          data['image'] = presignResult.items[0].publicUrl;
          this.logger.log(`[create] Image URL persisted: ${data['image']}`);
        } else {
          throw new BadRequestException('آدرس عمومی لوگو از سرور دریافت نشد.');
        }
      } catch (err) {
        this.logger.error(`[create] Image presign failed: ${err instanceof Error ? err.message : String(err)}`);
        throw err;
      }
    } else {
      this.logger.log(`[create] Image upload skipped: imageMeta=${!imageMeta}, imageUploadService=${!this.imageUploadService}`);
    }

    try {
      const companyDoc = await this.companyRepository.createOne(data);
      this.logger.log(`[create] SUCCESS: Company created with id=${companyDoc._id}`);
      return toPlain<ICompany>(companyDoc);
    } catch (err) {
      this.logger.error(`[create] Repository save failed: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  private requiredText(value: unknown, label: string): string {
    const normalized = typeof value === 'string' ? value.trim() : '';
    if (!normalized) throw new BadRequestException(`${label} الزامی است.`);
    return normalized;
  }

  async changeStatus(id: string, status: CompanyStatus, userId: string, privileged = false): Promise<ICompany> {
    const existing = await this.companyRepository.findById(id);
    if (!existing) { throw new NotFoundException(`Company with id ${id} not found`); }
    if (!privileged && !this.isCompanyMember(existing, userId)) {
      throw new ForbiddenException('You do not have permission to change company status');
    }
    const data: Partial<Company> = { status, updatedBy: new Types.ObjectId(userId) };
    const updated = await this.companyRepository.updateById(id, data);
    return toPlain<ICompany>(updated);
  }

  /**
   * Add a user id to company's admins array if not already present
   */
  async addAdminToCompany(companyId: string, adminUserId: string): Promise<void> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) { throw new NotFoundException(`Company with id ${companyId} not found`); }
    const adminObjectId = new Types.ObjectId(adminUserId);
    const currentAdmins = Array.isArray(company.admins) ? company.admins.map(a => a.toString()) : [];
    if (!currentAdmins.includes(adminUserId)) {
      company.admins = [...(company.admins || []), adminObjectId];
      await this.companyRepository.updateById(companyId, { admins: company.admins });
    }
  }

  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
    userId: string,
    privileged = false,
  ): Promise<ICompany> {
    const existing = await this.companyRepository.findById(id);
    if (!existing) { throw new NotFoundException(`Company with id ${id} not found`); }
    if (!privileged && !this.isCompanyMember(existing, userId)) {
      throw new ForbiddenException('You do not have permission to update this company');
    }

    const sellerType = updateCompanyDto.sellerType || existing.sellerType;
    this.requiredText(updateCompanyDto.name ?? existing.name, 'نام شرکت یا نام و نام خانوادگی');
    this.requiredText(updateCompanyDto.email ?? existing.email, 'ایمیل');
    this.requiredText(updateCompanyDto.phone ?? existing.phone, 'شماره تماس');
    this.requiredText(updateCompanyDto.address ?? existing.address, 'آدرس دفتر مرکزی');
    this.requiredText(updateCompanyDto.nationalId ?? existing.nationalId, 'کد ملی یا شناسه ملی');
    if (sellerType === SellerType.LEGAL) {
      this.requiredText(updateCompanyDto.registrationNumber ?? existing.registrationNumber, 'شماره ثبت برای شخص حقوقی');
    }
    if (!(updateCompanyDto.image?.trim() || existing.image || updateCompanyDto.imageMeta)) {
      throw new BadRequestException('لوگوی شرکت الزامی است. ابتدا تصویر را بارگذاری کنید.');
    }
    if (Object.prototype.hasOwnProperty.call(updateCompanyDto, 'image')
      && !updateCompanyDto.image?.trim()
      && !updateCompanyDto.imageMeta) {
      throw new BadRequestException('لوگوی شرکت نمی‌تواند خالی باشد.');
    }

    const data: Partial<Company> = {
      ...updateCompanyDto,
      updatedBy: new Types.ObjectId(userId),
    };

    // Integration: handle image presign if provided in update
    const imageMeta = (updateCompanyDto as UpdateCompanyDto).imageMeta;
    if (imageMeta && this.imageUploadService) {
      const presignPayload: CreatePresignDto = { type: 'company', files: [imageMeta] };
      const presignResult: CreatePresignResponseDto = await this.imageUploadService.createPresignedUrls(presignPayload);
      if (presignResult.items && presignResult.items.length > 0) {
        data.image = presignResult.items[0].publicUrl;
      }
    }

    const updatedDoc = await this.companyRepository.updateById(id, data);
    return toPlain<ICompany>(updatedDoc);
  }

  async remove(id: string, userId: string, privileged = false): Promise<void> {
    const existing = await this.companyRepository.findById(id);
    if (!existing) { throw new NotFoundException(`Company with id ${id} not found`); }
    if (!privileged && !this.isCompanyMember(existing, userId)) {
      throw new ForbiddenException('You do not have permission to delete this company');
    }
    await this.companyRepository.deleteById(id);
  }

  async findOne(id: string): Promise<ICompany> {
    const companyDoc = await this.companyRepository.findById(id);
    if (!companyDoc) { throw new NotFoundException(`Company with id ${id} not found`); }
    return toPlain<ICompany>(companyDoc);
  }

  async findAll(options: FindManyOptions = {}): Promise<ICompany[]> {
    const queryOptions: FindManyOptions = {
      ...options,
      populate: options.populate || ['createdBy', 'updatedBy'],
    };
    const companies = await this.companyRepository.findAll(queryOptions);
    return toPlainArray<ICompany>(companies);
  }

  async findAllWithTotal(options: FindManyOptions = {}): Promise<{ items: ICompany[]; total: number }> {
    const queryOptions: FindManyOptions = {
      ...options,
      populate: options.populate || [],
    };
    const [companies, total] = await Promise.all([
      this.companyRepository.findAll(queryOptions),
      this.companyRepository.countByCondition(queryOptions.conditions || {}),
    ]);
    return { items: toPlainArray<ICompany>(companies), total };
  }

  async existsByName(name: string): Promise<boolean> {
    return this.companyRepository.existsByCondition({ name });
  }

  async count(): Promise<number> {
    return this.companyRepository.countByCondition({});
  }

  async isUserAdmin(companyId: string, userId: string): Promise<boolean> {
    try {
      const company = await this.companyRepository.findById(companyId);
      if (!company) return false;
      
      return this.isCompanyMember(company, userId);
    } catch (error) {
      this.logger.error(`[isUserAdmin] Error checking admin status: ${error.message}`);
      return false;
    }
  }

  private isCompanyMember(company: Company, userId: string): boolean {
    return company.createdBy?.toString() === userId
      || (Array.isArray(company.admins) && company.admins.some((admin) => admin.toString() === userId));
  }
}
