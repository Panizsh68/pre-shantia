import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { AuthenticationGuard } from '../users/auth/guards/auth.guard';
import { Request } from 'express';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  @UseGuards(AuthenticationGuard)
  async getWallet(@Req() request: any) {
    const userId =  request.user.userId
    return await this.walletsService.getWallet(userId)
  }
}
