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
  ForbiddenException,
  NotFoundException,
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
import { isSuperAdmin } from 'src/common/utils/auth-helpers';
import { Public } from 'src/common/decorators/public.decorator';
import { IProfileService } from '../users/profile/interfaces/profile.service.interface';

function hasGlobalCompanyUpdatePermission(user: TokenPayload): boolean {
  if (isSuperAdmin(user)) return true;
  return user.permissions?.some((permission) =>
    permission.resource === Resource.COMPANIES
    && !permission.companyId
    && (permission.actions.includes(Action.UPDATE) || permission.actions.includes(Action.MANAGE)),
  ) || false;
}

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(
    @Inject('ICompanyService')
    private readonly companiesService: ICompanyService,
    @Inject('IProfileService')
    private readonly profileService: IProfileService,
  ) { }

  @Post()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @ApiBearerAuth()
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

  @Get('mine')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permission(Resource.COMPANIES, Action.READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the company linked to the authenticated user' })
  @ApiResponse({ status: 200, description: 'Linked company or null', type: Company })
  async findMine(@CurrentUser() user: TokenPayload) {
    const profile = await this.profileService.getByUserId(user.userId);
    if (!profile?.companyId) return null;
    try {
      return await this.companiesService.findOne(profile.companyId.toString());
    } catch (error) {
      if (error instanceof NotFoundException) return null;
      throw error;
    }
  }

  @Patch(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permission(Resource.COMPANIES, Action.UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Update a company by ID',
    description: 'Company admins can update their own company. Superadmins can update any company.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Company ID' })
  @ApiBody({ type: UpdateCompanyDto })
  @ApiResponse({ status: 200, description: 'Company updated successfully', type: Company })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not admin of this company' })
  async update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentUser() user: TokenPayload,
  ) {
    // Superadmins can update any company
    if (!isSuperAdmin(user)) {
      // Check if user is admin of this company
      const isCompanyAdmin = await this.companiesService.isUserAdmin(id, user.userId);
      if (!isCompanyAdmin) {
        throw new ForbiddenException('You are not an admin of this company');
      }
    }
    return this.companiesService.update(id, updateCompanyDto, user.userId, isSuperAdmin(user));
  }

  @Patch(':id/status')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permission(Resource.COMPANIES, Action.UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: "Change company's status",
    description: 'Company admins can change their own company status. Superadmins can change any company status.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Company ID' })
  @ApiBody({ type: ChangeCompanyStatusDto })
  @ApiResponse({ status: 200, description: 'Company status changed successfully', type: Company })
  @ApiResponse({ status: 403, description: 'Forbidden - not admin of this company' })
  async changeStatus(
    @Param('id') id: string,
    @Body() body: ChangeCompanyStatusDto,
    @CurrentUser() user: TokenPayload,
  ) {
    // Superadmins can change any company status
    if (!isSuperAdmin(user)) {
      // Check if user is admin of this company
      const isCompanyAdmin = await this.companiesService.isUserAdmin(id, user.userId);
      if (!isCompanyAdmin) {
        throw new ForbiddenException('You are not an admin of this company');
      }
    }
    return this.companiesService.changeStatus(id, body.status as CompanyStatus, user.userId, isSuperAdmin(user));
  }

  @Delete(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permission(Resource.COMPANIES, Action.DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete company by ID',
    description: 'Company admins can delete their own company. Superadmins can delete any company.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Company ID' })
  @ApiResponse({ status: 204, description: 'Company deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not admin of this company' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ) {
    // Superadmins can delete any company
    if (!isSuperAdmin(user)) {
      // Check if user is admin of this company
      const isCompanyAdmin = await this.companiesService.isUserAdmin(id, user.userId);
      if (!isCompanyAdmin) {
        throw new ForbiddenException('You are not an admin of this company');
      }
    }
    await this.companiesService.remove(id, user.userId, isSuperAdmin(user));
  }

  @Get('manage')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permission(Resource.COMPANIES, Action.UPDATE)
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 25 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'sort', required: false, type: String, example: 'createdAt:desc' })
  @ApiQuery({ name: 'filter', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: CompanyStatus })
  @ApiOperation({ summary: 'List companies for authorized panel users' })
  async manage(
    @CurrentUser() user: TokenPayload,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('sort') sort?: string,
    @Query('filter') filter?: string,
    @Query('status') status?: CompanyStatus,
  ) {
    if (!hasGlobalCompanyUpdatePermission(user)) {
      throw new ForbiddenException('مدیریت فهرست شرکت‌ها فقط برای ادمین مجاز است.');
    }
    const options: FindManyOptions = {};
    if (limit) {
      const parsedLimit = Number(limit);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        throw new BadRequestException('Limit must be an integer between 1 and 100');
      }
      options.perPage = parsedLimit;
    }
    if (page) {
      const parsedPage = Number(page);
      if (!Number.isInteger(parsedPage) || parsedPage < 1) {
        throw new BadRequestException('Page must be a positive integer');
      }
      options.page = parsedPage;
    }
    if (status && !Object.values(CompanyStatus).includes(status)) {
      throw new BadRequestException('Company status is invalid');
    }
    if (filter?.trim()) {
      const escaped = filter.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      options.conditions = {
        ...(status ? { status } : {}),
        $or: [
          { name: { $regex: escaped, $options: 'i' } },
          { email: { $regex: escaped, $options: 'i' } },
          { phone: { $regex: escaped, $options: 'i' } },
          { registrationNumber: { $regex: escaped, $options: 'i' } },
        ],
      } as any;
    } else if (status) {
      options.conditions = { status } as any;
    }
    if (sort) {
      const [field, order] = sort.split(':');
      const allowedFields = new Set(['createdAt', 'name', 'email', 'status']);
      if (!allowedFields.has(field) || !['asc', 'desc'].includes(order)) {
        throw new BadRequestException('Sort is invalid');
      }
      options.sort = [{ field, order: order as any }];
    }
    const result = await this.companiesService.findAllWithTotal(options);
    return { ...result, page: options.page || 1, limit: options.perPage || 10 };
  }

  @Get('exists/name/:name')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @ApiBearerAuth()
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
  @ApiBearerAuth()
  @Permission(Resource.COMPANIES, Action.READ)
  @ApiOperation({ summary: 'Get total number of companies' })
  @ApiResponse({ status: 200, description: 'Total count returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async count() {
    return { count: await this.companiesService.count() };
  }

  @Get(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permission(Resource.COMPANIES, Action.READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get an authorized company by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company found', type: Company })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: TokenPayload) {
    if (!isSuperAdmin(user) && !(await this.companiesService.isUserAdmin(id, user.userId))) {
      throw new ForbiddenException('You are not an admin of this company');
    }
    return this.companiesService.findOne(id);
  }

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all companies', security: [] })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'List of all companies', type: [Company] })
  findAll(
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const options: FindManyOptions = {
      conditions: { status: CompanyStatus.ACTIVE } as any,
      select: ['name', 'address', 'status', 'image', 'sellerType', 'createdAt'],
      populate: [],
    };
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

}
