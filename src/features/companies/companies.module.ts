import { Module, forwardRef } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from './entities/company.entity';
import { Model } from 'mongoose';
import { CompanyRepository, ICompanyRepository } from './repositories/company.repository';
import { PermissionsModule } from 'src/features/permissions/permissions.module';
import { ImageUploadModule } from 'src/features/image-upload/image-upload.module';
import {
  BASE_AGGREGATE_REPOSITORY,
  BASE_TRANSACTION_REPOSITORY,
} from 'src/libs/repository/constants/tokens.constants';

@Module({
  imports: [MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]), forwardRef(() => PermissionsModule), forwardRef(() => ImageUploadModule)],
  controllers: [CompaniesController],
  providers: [
    {
      provide: 'CompanyRepository',
      useFactory: (companyModel: Model<Company>, aggregateRepo, transactionRepo): ICompanyRepository => {
        return new CompanyRepository(companyModel, aggregateRepo, transactionRepo);
      },
      inject: [getModelToken(Company.name), BASE_AGGREGATE_REPOSITORY, BASE_TRANSACTION_REPOSITORY],
    },
    {
      provide: 'ICompanyService',
      useClass: CompaniesService,
    },
  ],
  exports: ['ICompanyService'],
})
export class CompaniesModule { }
