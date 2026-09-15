import { BadRequestException, Body, Controller, ForbiddenException, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { PublicSubmissionsService } from './public-submissions.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateVendorRequestDto } from './dto/create-vendor-request.dto';
import { ReviewVendorRequestDto } from './dto/review-vendor-request.dto';
import { AbuseRateLimit } from 'src/common/abuse/abuse-rate-limit.decorator';
import { AbuseRateLimitGuard } from 'src/common/abuse/abuse-rate-limit.guard';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../permissions/guard/permission.guard';
import { Permission } from '../permissions/decorators/permissions.decorators';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { TokenPayload } from '../auth/interfaces/token-payload.interface';
import { VendorRequestStatus } from './enums/vendor-request-status.enum';

function hasGlobalCompanyUpdatePermission(user: TokenPayload): boolean {
  return user.permissions?.some((permission) =>
    permission.resource === Resource.ALL && permission.actions.includes(Action.MANAGE),
  ) || user.permissions?.some((permission) =>
    permission.resource === Resource.COMPANIES
    && !permission.companyId
    && (permission.actions.includes(Action.UPDATE) || permission.actions.includes(Action.MANAGE)),
  ) || false;
}

function parsePositiveInteger(value: string | undefined, field: string, maximum?: number): number | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || (maximum !== undefined && parsed > maximum)) {
    throw new BadRequestException(`${field} نامعتبر است.`);
  }
  return parsed;
}

@ApiTags('Public Submissions')
@Controller()
export class PublicSubmissionsController {
  constructor(private readonly submissionsService: PublicSubmissionsService) {}

  @Post('contact')
  @Public()
  @UseGuards(AbuseRateLimitGuard)
  @AbuseRateLimit({ name: 'contact', identity: 'ip', config: 'PUBLIC_FORM' })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a contact inquiry', description: 'Send a public inquiry or support message without authentication.' })
  @ApiBody({ type: CreateContactDto })
  @ApiResponse({ status: 201, description: 'Contact inquiry submitted successfully.' })
  async createContact(@Body() body: CreateContactDto) {
    return this.submissionsService.createContact(body);
  }

  @Post('vendor-requests')
  @Public()
  @UseGuards(AbuseRateLimitGuard)
  @AbuseRateLimit({ name: 'vendor-request', identity: 'ip', config: 'PUBLIC_FORM' })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a vendor registration request', description: 'Send a public request to become a vendor without requiring authentication.' })
  @ApiBody({ type: CreateVendorRequestDto })
  @ApiResponse({ status: 201, description: 'Vendor request submitted successfully.' })
  async createVendorRequest(@Body() body: CreateVendorRequestDto) {
    return this.submissionsService.createVendorRequest(body);
  }

  @Post('vendor-requests/me')
  @UseGuards(AuthenticationGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a vendor registration request for the authenticated user' })
  @ApiBody({ type: CreateVendorRequestDto })
  async createMyVendorRequest(
    @Body() body: CreateVendorRequestDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.submissionsService.createVendorRequest(body, user.userId);
  }

  @Get('vendor-requests/me')
  @UseGuards(AuthenticationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated user vendor requests' })
  async getMyVendorRequests(@CurrentUser() user: TokenPayload) {
    return this.submissionsService.getMyVendorRequests(user.userId);
  }

  @Get('vendor-requests')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permission(Resource.COMPANIES, Action.UPDATE)
  @ApiQuery({ name: 'status', required: false, enum: VendorRequestStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'List vendor registration requests for administrators' })
  async listVendorRequests(
    @CurrentUser() user: TokenPayload,
    @Query('status') status?: VendorRequestStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!hasGlobalCompanyUpdatePermission(user)) {
      throw new ForbiddenException('مدیریت درخواست‌های فروشندگی فقط برای ادمین مجاز است.');
    }
    if (status && !Object.values(VendorRequestStatus).includes(status)) {
      throw new BadRequestException('وضعیت درخواست نامعتبر است.');
    }
    const parsedPage = parsePositiveInteger(page, 'صفحه');
    const parsedLimit = parsePositiveInteger(limit, 'تعداد', 100);
    return this.submissionsService.listVendorRequests({
      status,
      page: parsedPage,
      limit: parsedLimit,
    });
  }

  @Patch('vendor-requests/:id/review')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permission(Resource.COMPANIES, Action.UPDATE)
  @ApiBody({ type: ReviewVendorRequestDto })
  @ApiOperation({ summary: 'Approve or reject a vendor registration request' })
  async reviewVendorRequest(
    @Param('id') id: string,
    @Body() body: ReviewVendorRequestDto,
    @CurrentUser() user: TokenPayload,
  ) {
    if (!hasGlobalCompanyUpdatePermission(user)) {
      throw new ForbiddenException('بررسی درخواست‌های فروشندگی فقط برای ادمین مجاز است.');
    }
    return this.submissionsService.reviewVendorRequest(id, body.status, user.userId, body.rejectionReason);
  }
}
