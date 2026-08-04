import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { PublicSubmissionsService } from './public-submissions.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateVendorRequestDto } from './dto/create-vendor-request.dto';
import { AbuseRateLimit } from 'src/common/abuse/abuse-rate-limit.decorator';
import { AbuseRateLimitGuard } from 'src/common/abuse/abuse-rate-limit.guard';

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
}
