import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Company } from './entities/company.entity';
import { ICompanyService } from './interfaces/company.service.interface';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../permissions/guard/permission.guard';
import { Permission } from '../permissions/decorators/permissions.decorators';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { ChangeCompanyStatusDto } from './dto/change-company-status.dto';
import { CompanyStatus } from './enums/status.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { TokenPayload } from '../auth/interfaces/token-payload.interface';
import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';
import { RequestContext } from 'src/common/decorators/request-context.decorator';
import { RequestContext as IRequestContext } from 'src/common/types/request-context.interface';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(
    @Inject('ICompanyService')
    private readonly companiesService: ICompanyService,
  ) { }

  @Post()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.COMPANIES, Action.CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new company' })
  @ApiBody({ type: CreateCompanyDto })
  @ApiResponse({ status: 201, description: 'Company created successfully', type: Company })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() createCompanyDto: CreateCompanyDto,
    @CurrentUser() user: TokenPayload,
    @RequestContext() ctx: IRequestContext,
  ) {
    return this.companiesService.create(createCompanyDto, user.userId, ctx);
  }

  @Patch(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.COMPANIES, Action.UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a company by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Company ID' })
  @ApiBody({ type: UpdateCompanyDto })
  @ApiResponse({ status: 200, description: 'Company updated successfully', type: Company })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.companiesService.update(id, updateCompanyDto, user.userId);
  }

  @Patch(':id/status')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.COMPANIES, Action.UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Change company's status" })
  @ApiParam({ name: 'id', type: String, description: 'Company ID' })
  @ApiBody({ type: ChangeCompanyStatusDto })
  async changeStatus(
    @Param('id') id: string,
    @Body() body: ChangeCompanyStatusDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.companiesService.changeStatus(id, body.status as CompanyStatus, user.userId);
  }

  @Delete(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.COMPANIES, Action.DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete company by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Company ID' })
  @ApiResponse({ status: 204, description: 'Company deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ) {
    await this.companiesService.remove(id, user.userId);
  }

  @Get(':id')

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company found', type: Company })
  @ApiResponse({ status: 404, description: 'Company not found' })
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all companies' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'List of all companies', type: [Company] })
  findAll(
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const options: FindManyOptions = {};
    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        throw new BadRequestException('Limit must be a positive integer');
      }
      options.perPage = parsedLimit;
    }
    if (page) {
      const parsedPage = parseInt(page, 10);
      if (isNaN(parsedPage) || parsedPage < 1) {
        throw new BadRequestException('Page must be a positive integer');
      }
      options.page = parsedPage;
    }
    return this.companiesService.findAll(options);
  }

  @Get('exists/name/:name')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.COMPANIES, Action.READ)
  @ApiOperation({ summary: 'Check if a company exists by name' })
  @ApiParam({ name: 'name', type: String, description: 'Company name' })
  @ApiResponse({ status: 200, description: 'Existence result' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async existsByName(@Param('name') name: string) {
    return { exists: await this.companiesService.existsByName(name) };
  }

  @Get('count')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.COMPANIES, Action.READ)
  @ApiOperation({ summary: 'Get total number of companies' })
  @ApiResponse({ status: 200, description: 'Total count returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async count() {
    return { count: await this.companiesService.count() };
  }
}
