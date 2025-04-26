import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from './entities/company.entity';
import { CompanyRepository } from './repositories/company.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: Company.name , schema: CompanySchema }])],
  controllers: [CompaniesController],
  providers: [
    {
      provide: 'CompanyRepository',
      useClass: CompanyRepository,
    },
    CompaniesService],
})
export class CompaniesModule {}
