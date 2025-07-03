import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from './entities/company.entity';
import { Model } from 'mongoose';
import { CompanyRepository, ICompanyRepository } from './repositories/company.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }])],
  controllers: [CompaniesController],
  providers: [
    {
      provide: 'CompanyRepository',
      useFactory: (companyModel: Model<Company>): ICompanyRepository => {
        return new CompanyRepository(companyModel);
      },
      inject: [getModelToken(Company.name)],
    },
    {
      provide: 'ICompanyService',
      useClass: CompaniesService
    },
  ],
  exports: ['ICompanyService']
})
export class CompaniesModule {}
