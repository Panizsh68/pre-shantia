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
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { Company } from './entities/company.entity';
import { Public } from 'src/common/decorators/public.decorator';
import { ICompanyService } from './interfaces/company.service.interface';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { Permission } from '../permissions/decoratorss/permissions.decorators';
import { PermissionsGuard } from '../permissions/guard/permission.guard';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateCompanyDto } from './dto/create-company.dto';

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(
    @Inject('ICompanyService')
    private readonly companiesService: ICompanyService,
  ) {}

  @Post()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.COMPANIES, Action.CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new company' })
  @ApiBody({ type: CreateCompanyDto })
  @ApiResponse({ status: 201, description: 'Company created successfully', type: Company })
  createCompany(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.createCompany(createCompanyDto);
  }

  @Patch(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.COMPANIES, Action.UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a company by ID' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiBody({ type: Company })
  @ApiResponse({ status: 200, description: 'Company updated successfully', type: Company })
  updateCompany(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.updateCompany(id, updateCompanyDto);
  }

  @Delete(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.COMPANIES, Action.DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a company by ID' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company deleted successfully' })
  deleteCompany(@Param('id') id: string) {
    return this.companiesService.deleteCompany(id);
  }

  @Get(':id')
  @UseGuards(AuthenticationGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a company by ID' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company fetched successfully', type: Company })
  getCompanyById(@Param('id') id: string) {
    return this.companiesService.getCompanyById(id);
  }

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all companies' })
  @ApiResponse({ status: 200, description: 'List of all companies', type: [Company] })
  getAllCompanies() {
    return this.companiesService.getAllCompanies();
  }
}
