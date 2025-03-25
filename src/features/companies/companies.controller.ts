import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { DeleteResult } from 'mongoose';
import { ICompanyService } from './interfaces/company.service.interface';

@Controller('companies')
export class CompaniesController implements ICompanyService {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  async createCompany(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.createCompany(createCompanyDto);
  }

  @Get()
  async findAllCompanies() {
    return this.companiesService.findAllCompanies();
  }

  @Get(':id')
  async findOneCompany(@Param('id') id: string) {
    return this.companiesService.findOneCompany(id);
  }

  @Patch(':id')
  async updateCompany(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.updateCompany(id, updateCompanyDto);
  }

  @Delete(':id')
  async removeCompany(@Param('id') id: string): Promise<DeleteResult> {
    return this.companiesService.removeCompany(id);
  }
}
