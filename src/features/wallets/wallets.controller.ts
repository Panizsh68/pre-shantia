import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { GetWalletDto } from './dto/get-wallet.dto';
import { plainToInstance } from 'class-transformer';
import { TokenPayload } from '../auth/interfaces/token-payload.interface';
import { determineOwnerType } from 'src/utils/wallet-owner.util';
import { AuthenticatedRequest } from './interfaces/authentication-request.interface';
import { Wallet } from './entities/wallet.entity';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  @UseGuards(AuthenticationGuard)
  async getWallet(@Req() request: AuthenticatedRequest & { user: TokenPayload }): Promise<Wallet> {
    const ownerType = determineOwnerType(request.user.roles);

    const dto = plainToInstance(GetWalletDto, {
      ownerId: request.user.userId,
      ownerType,
    });
    const wallet = await this.walletsService.getWallet(dto);
    return wallet;
  }
}
