import { BadRequestException, Body, Controller, ForbiddenException, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { AbuseRateLimit } from 'src/common/abuse/abuse-rate-limit.decorator';
import { AbuseRateLimitGuard } from 'src/common/abuse/abuse-rate-limit.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { hasPermission, isSuperAdmin } from 'src/common/utils/auth-helpers';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { TokenPayload } from '../auth/interfaces/token-payload.interface';
import { Action } from '../permissions/enums/actions.enum';
import { Resource } from '../permissions/enums/resources.enum';
import { Permission } from '../permissions/decorators/permissions.decorators';
import { PermissionsGuard } from '../permissions/guard/permission.guard';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { ReviewCustomerRequestDto } from './dto/review-customer-request.dto';
import { CustomerRequestStatus } from './enums/customer-request-status.enum';
import { CustomerRequestType } from './enums/customer-request-type.enum';
import { CustomerRequestsService } from './customer-requests.service';

function parsePositiveInteger(value: string | undefined, field: string, maximum?: number): number | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || (maximum !== undefined && parsed > maximum)) {
    throw new BadRequestException(`${field} نامعتبر است.`);
  }
  return parsed;
}

function hasRequestAdminAccess(user: TokenPayload): boolean {
  return isSuperAdmin(user)
    || hasPermission(user, Resource.ORDERS, Action.UPDATE)
    || hasPermission(user, Resource.COMPANIES, Action.UPDATE);
}

@ApiTags('Customer Requests')
@Controller('customer-requests')
export class CustomerRequestsController {
  constructor(private readonly requestsService: CustomerRequestsService) {}

  @Post('price-quotes')
  @UseGuards(AuthenticationGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CreateQuoteRequestDto })
  @ApiOperation({ summary: 'ثبت درخواست استعلام قیمت برای کاربر واردشده' })
  createPriceQuote(@Body() body: CreateQuoteRequestDto, @CurrentUser() user: TokenPayload) {
    return this.requestsService.createQuote(body, user.userId, CustomerRequestType.PRICE_QUOTE);
  }

  @Post('wholesale')
  @UseGuards(AuthenticationGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CreateQuoteRequestDto })
  @ApiOperation({ summary: 'ثبت درخواست خرید عمده برای کاربر واردشده' })
  createWholesale(@Body() body: CreateQuoteRequestDto, @CurrentUser() user: TokenPayload) {
    return this.requestsService.createQuote(body, user.userId, CustomerRequestType.WHOLESALE);
  }

  @Post('reports')
  @Public()
  @UseGuards(AbuseRateLimitGuard)
  @AbuseRateLimit({ name: 'abuse-report', identity: 'ip', config: 'PUBLIC_FORM' })
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CreateReportDto })
  @ApiOperation({ summary: 'ثبت گزارش تخلف' })
  createReport(@Body() body: CreateReportDto) {
    return this.requestsService.createReport(body);
  }

  @Get('me')
  @UseGuards(AuthenticationGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'type', required: false, enum: CustomerRequestType })
  @ApiOperation({ summary: 'نمایش درخواست‌های کاربر جاری' })
  listMine(@CurrentUser() user: TokenPayload, @Query('type') type?: CustomerRequestType) {
    if (type && !Object.values(CustomerRequestType).includes(type)) throw new BadRequestException('نوع درخواست نامعتبر است.');
    if (type === CustomerRequestType.ABUSE_REPORT) throw new BadRequestException('گزارش تخلف عمومی است.');
    return this.requestsService.listMine(user.userId, type);
  }

  @Get('me/:id')
  @UseGuards(AuthenticationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'نمایش جزئیات درخواست خود کاربر' })
  getMine(@Param('id') id: string, @CurrentUser() user: TokenPayload) {
    return this.requestsService.findMineById(id, user.userId);
  }

  @Get()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.COMPANIES, Action.READ)
  @ApiBearerAuth()
  @ApiQuery({ name: 'type', required: false, enum: CustomerRequestType })
  @ApiQuery({ name: 'status', required: false, enum: CustomerRequestStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'مدیریت درخواست‌های استعلام، عمده و گزارش تخلف برای ادمین' })
  listForAdmin(
    @CurrentUser() user: TokenPayload,
    @Query('type') type?: CustomerRequestType,
    @Query('status') status?: CustomerRequestStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!hasRequestAdminAccess(user)) throw new ForbiddenException('مدیریت درخواست‌ها فقط برای ادمین مجاز است.');
    if (type && !Object.values(CustomerRequestType).includes(type)) throw new BadRequestException('نوع درخواست نامعتبر است.');
    if (status && !Object.values(CustomerRequestStatus).includes(status)) throw new BadRequestException('وضعیت درخواست نامعتبر است.');
    return this.requestsService.listForAdmin({
      type,
      status,
      page: parsePositiveInteger(page, 'صفحه'),
      limit: parsePositiveInteger(limit, 'تعداد', 100),
    });
  }

  @Get(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.COMPANIES, Action.READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'نمایش جزئیات درخواست برای ادمین' })
  async getForAdmin(@Param('id') id: string, @CurrentUser() user: TokenPayload) {
    if (!hasRequestAdminAccess(user)) throw new ForbiddenException('دسترسی مدیریت درخواست‌ها ندارید.');
    return this.requestsService.findById(id);
  }

  @Patch(':id/review')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.COMPANIES, Action.UPDATE)
  @ApiBearerAuth()
  @ApiBody({ type: ReviewCustomerRequestDto })
  @ApiOperation({ summary: 'پاسخ و تغییر وضعیت درخواست توسط ادمین' })
  async review(@Param('id') id: string, @Body() body: ReviewCustomerRequestDto, @CurrentUser() user: TokenPayload) {
    if (!hasRequestAdminAccess(user)) throw new ForbiddenException('مدیریت درخواست‌ها فقط برای ادمین مجاز است.');
    return this.requestsService.review(id, body, user.userId);
  }
}
