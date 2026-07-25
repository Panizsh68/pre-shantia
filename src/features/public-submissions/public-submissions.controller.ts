import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { PublicSubmissionsService } from './public-submissions.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateVendorRequestDto } from './dto/create-vendor-request.dto';

@ApiTags('Public Submissions')
@Controller()
export class PublicSubmissionsController {
  constructor(private readonly submissionsService: PublicSubmissionsService) {}

  @Post('contact')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a contact inquiry', description: 'Send a public inquiry or support message without authentication.' })
  @ApiBody({ type: CreateContactDto })
  @ApiResponse({ status: 201, description: 'Contact inquiry submitted successfully.' })
  async createContact(@Body() body: CreateContactDto) {
    return this.submissionsService.createContact(body);
  }

  @Post('vendor-requests')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a vendor registration request', description: 'Send a public request to become a vendor without requiring authentication.' })
  @ApiBody({ type: CreateVendorRequestDto })
  @ApiResponse({ status: 201, description: 'Vendor request submitted successfully.' })
  async createVendorRequest(@Body() body: CreateVendorRequestDto) {
    return this.submissionsService.createVendorRequest(body);
  }
}
