import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from './entities/company.entity';
import { CompanyRepository } from './repositories/company.repository';
import { Model } from 'mongoose';

@Module({
  imports: [MongooseModule.forFeature([{ name: Company.name , schema: CompanySchema }])],
  controllers: [CompaniesController],
  providers: [
    {
      provide: 'CompanyRepository',
      useFactory: (transactionModel: Model<Company>) => {
        return new CompanyRepository(transactionModel);
      }, 
      inject: [getModelToken(Company.name)],
    },
    CompaniesService],
})
export class CompaniesModule {}
