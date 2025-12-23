import { Inject, Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
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

@Injectable()
export class CompaniesService implements ICompanyService {
  private readonly logger = new Logger(CompaniesService.name);

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

    const data: Partial<Company> = {
      ...createCompanyDto,
      createdBy: new Types.ObjectId(userId),
      updatedBy: new Types.ObjectId(userId),
      status: CompanyStatus.PENDING,
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

  async changeStatus(id: string, status: CompanyStatus, userId: string): Promise<ICompany> {
    const existing = await this.companyRepository.findById(id);
    if (!existing) { throw new NotFoundException(`Company with id ${id} not found`); }
    // only creator can change status (business rule) — keep existing authorization
    if (existing.createdBy.toString() !== userId) {
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
  ): Promise<ICompany> {
    const existing = await this.companyRepository.findById(id);
    if (!existing) { throw new NotFoundException(`Company with id ${id} not found`); }
    if (existing.createdBy.toString() !== userId) { throw new ForbiddenException('You do not have permission to update this company'); }

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

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.companyRepository.findById(id);
    if (!existing) { throw new NotFoundException(`Company with id ${id} not found`); }
    if (existing.createdBy.toString() !== userId) { throw new ForbiddenException('You do not have permission to delete this company'); }
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
      
      // Check if user is the creator/admin of this company
      return company.createdBy?.toString() === userId;
    } catch (error) {
      this.logger.error(`[isUserAdmin] Error checking admin status: ${error.message}`);
      return false;
    }
  }
}
