import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ICompanyRepository } from './repositories/company.repository';
import { Company } from './entities/company.entity';
import { ICompany } from './interfaces/company.interface';
import { ICompanyService } from './interfaces/company.service.interface';
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
  constructor(
    @Inject('CompanyRepository') private readonly companyRepository: ICompanyRepository,
    @Inject(IImageUploadServiceToken) private readonly imageUploadService?: IImageUploadService,
  ) { }

  async create(
    createCompanyDto: CreateCompanyDto,
    userId: string,
    ctx: RequestContext,
  ): Promise<ICompany> {
    const data: Partial<Company> = {
      ...createCompanyDto,
      createdBy: new Types.ObjectId(userId),
      updatedBy: new Types.ObjectId(userId),
    };

    // Integration: if frontend provides image metadata to be presigned, request presigns and persist public URL
    // Expect createCompanyDto.imageMeta to be { filename, contentType, size }
    const imageMeta = (createCompanyDto as CreateCompanyDto).imageMeta;
    if (imageMeta && this.imageUploadService) {
      const presignPayload: CreatePresignDto = { type: 'company', files: [imageMeta] };
      const presignResult: CreatePresignResponseDto = await this.imageUploadService.createPresignedUrls(presignPayload);
      if (presignResult.items && presignResult.items.length > 0) {
        data['image'] = presignResult.items[0].publicUrl;
      }
    }

    const companyDoc = await this.companyRepository.createOne(data);
    return toPlain<ICompany>(companyDoc);
  }

  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
    userId: string,
  ): Promise<ICompany> {
    const existing = await this.companyRepository.findById(id);
    if (!existing) throw new NotFoundException(`Company with id ${id} not found`);
    if (existing.createdBy.toString() !== userId)
      throw new ForbiddenException('You do not have permission to update this company');
    const data: Partial<Company> = {
      ...updateCompanyDto,
      updatedBy: new Types.ObjectId(userId),
    };
    const updatedDoc = await this.companyRepository.updateById(id, data);
    return toPlain<ICompany>(updatedDoc);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.companyRepository.findById(id);
    if (!existing) throw new NotFoundException(`Company with id ${id} not found`);
    if (existing.createdBy.toString() !== userId)
      throw new ForbiddenException('You do not have permission to delete this company');
    await this.companyRepository.deleteById(id);
  }

  async findOne(id: string): Promise<ICompany> {
    const companyDoc = await this.companyRepository.findById(id);
    if (!companyDoc) throw new NotFoundException(`Company with id ${id} not found`);
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
}
