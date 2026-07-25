import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PublicSubmission, PublicSubmissionType } from './entities/public-submission.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateVendorRequestDto } from './dto/create-vendor-request.dto';

@Injectable()
export class PublicSubmissionsService {
  constructor(
    @InjectModel(PublicSubmission.name)
    private readonly submissionModel: Model<PublicSubmission>,
  ) {}

  async createContact(dto: CreateContactDto): Promise<PublicSubmission> {
    return this.submissionModel.create({
      type: PublicSubmissionType.Contact,
      name: dto.name,
      email: dto.email,
      message: dto.message,
    });
  }

  async createVendorRequest(dto: CreateVendorRequestDto): Promise<PublicSubmission> {
    return this.submissionModel.create({
      type: PublicSubmissionType.VendorRequest,
      companyName: dto.companyName,
      email: dto.email,
      phone: dto.phone,
      registrationNumber: dto.registrationNumber,
      nationalId: dto.nationalId,
      address: dto.address,
      imageUrl: dto.imageUrl,
    });
  }
}
