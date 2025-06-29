import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { Company } from './entities/company.entity';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createCompany(@Body() companyData: Partial<Company>) {
    return this.companiesService.createCompany(companyData);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  updateCompany(@Param('id') id: string, @Body() updateData: Partial<Company>) {
    return this.companiesService.updateCompany(id, updateData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteCompany(@Param('id') id: string) {
    return this.companiesService.deleteCompany(id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  getCompanyById(@Param('id') id: string) {
    return this.companiesService.getCompanyById(id);
  }

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  getAllCompanies() {
    return this.companiesService.getAllCompanies();
  }
}
