import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { Permission } from '../permissions/decorators/permissions.decorators';
import { PermissionsGuard } from '../permissions/guard/permission.guard';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { GetWalletDto } from './dto/get-wallet.dto';
import { CreditWalletDto, CreditWalletRequestDto } from './dto/credit-wallet.dto';
import { DebitWalletDto, DebitWalletRequestDto, TransferWalletRequestDto } from './dto/debit-wallet.dto';
import { plainToInstance } from 'class-transformer';
import { TokenPayload } from '../auth/interfaces/token-payload.interface';
import { AuthenticatedRequest } from './interfaces/authentication-request.interface';
import { Wallet } from './entities/wallet.entity';
import { determineOwnerTypeFromPermissions } from 'src/utils/wallet-owner.util';
import { WalletOwnerType } from './enums/wallet-ownertype.enum';

@ApiTags('Wallets')
@ApiBearerAuth()
@Controller('wallets')
export class WalletsController {
  constructor(@Inject('IWalletsService') private readonly walletsService: WalletsService) { }

  @Get()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.WALLETS, Action.READ)
  @ApiOperation({ summary: 'Get wallet for authenticated user', description: 'This route is open for default users.' })
  @ApiResponse({ status: 200, description: 'Wallet returned', type: Wallet })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWallet(@Req() request: AuthenticatedRequest & { user: TokenPayload }): Promise<Wallet> {
    const ownerType = determineOwnerTypeFromPermissions(request.user.permissions);
    const dto = plainToInstance(GetWalletDto, {
      ownerId: request.user.userId,
      ownerType,
    });
    const wallet = await this.walletsService.getWallet(dto);
    return wallet;
  }

  @Post('credit')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.WALLETS, Action.UPDATE)
  @ApiOperation({
    summary: 'Credit wallet',
    description: 'Credits the authenticated owner wallet; owner is derived from permissions.',
  })
  @ApiBody({ type: CreditWalletRequestDto })
  @ApiResponse({ status: 200, description: 'Wallet credited', type: Wallet })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async creditWallet(
    @Body() dto: CreditWalletRequestDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<Wallet> {
    const ownerType = determineOwnerTypeFromPermissions(user.permissions);
    const ownerId = user.userId;
    const input: CreditWalletDto = { ...dto, ownerId, ownerType };
    return this.walletsService.creditWallet(input);
  }

  @Post('debit')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.WALLETS, Action.UPDATE)
  @ApiOperation({
    summary: 'Debit wallet',
    description: 'Debits the authenticated owner wallet. ownerId/ownerType must match the token-derived owner.',
  })
  @ApiBody({ type: DebitWalletRequestDto })
  @ApiResponse({ status: 200, description: 'Wallet debited', type: Wallet })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async debitWallet(
    @Body() dto: DebitWalletRequestDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<Wallet> {
    const ownerType = determineOwnerTypeFromPermissions(user.permissions);
    const ownerId = user.userId;
    const input: DebitWalletDto = { ...dto, ownerId, ownerType };
    return this.walletsService.debitWallet(input);
  }

  @Post('transfer')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.WALLETS, Action.deposit_intermediary)
  @ApiOperation({
    summary: 'Transfer funds between wallets',
    description: 'Users can only transfer to intermediary wallets. For users, toOwnerType defaults to intermediary.',
  })
  @ApiBody({ type: TransferWalletRequestDto })
  @ApiResponse({ status: 200, description: 'Transfer successful' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async transfer(
    @Body() body: TransferWalletRequestDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<{ success: boolean }> {
    const ownerType = determineOwnerTypeFromPermissions(user.permissions);
    const ownerId = user.userId;
    const from = { ownerId, ownerType };
    const toOwnerType = body.toOwnerType ?? (from.ownerType === WalletOwnerType.USER ? WalletOwnerType.INTERMEDIARY : body.toOwnerType);
    if (!toOwnerType) {
      throw new BadRequestException('toOwnerType is required');
    }
    const to = { ownerId: body.toOwnerId, ownerType: toOwnerType };
    if (from.ownerId === to.ownerId && from.ownerType === to.ownerType) {
      throw new BadRequestException('Self-transfer is not allowed');
    }
    if (body.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }
    // اگر کاربر عادی هست، فقط می‌تواند به کاربران عادی دیگر انتقال دهد
    // کاربر عادی فقط می‌تواند به شرکت واسطه انتقال دهد
    if (from.ownerType === WalletOwnerType.USER && to.ownerType !== WalletOwnerType.INTERMEDIARY) {
      throw new BadRequestException('Users can only transfer to intermediary companies');
    }
    await this.walletsService.transfer(from, to, body.amount);
    return { success: true };
  }
}
