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
import { Permission } from '../permissions/decoratorss/permissions.decorators';
import { PermissionsGuard } from '../permissions/guard/permission.guard';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { GetWalletDto } from './dto/get-wallet.dto';
import { CreditWalletDto } from './dto/credit-wallet.dto';
import { DebitWalletDto } from './dto/debit-wallet.dto';
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
  @Permission(Resource.WALLETS, Action.DEFAULT)
  @ApiOperation({ summary: 'Get wallet for authenticated user' })
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
  @UseGuards(AuthenticationGuard)
  @ApiOperation({ summary: 'Credit wallet' })
  @ApiBody({ type: CreditWalletDto })
  @ApiResponse({ status: 200, description: 'Wallet credited', type: Wallet })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async creditWallet(
    @Body() dto: CreditWalletDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<Wallet> {
    const ownerType = determineOwnerTypeFromPermissions(user.permissions);
    const ownerId = user.userId;
    if (dto.ownerId && dto.ownerId !== ownerId) {
      throw new BadRequestException('ownerId mismatch with authenticated user');
    }
    if (dto.ownerType && dto.ownerType !== ownerType) {
      throw new BadRequestException('ownerType mismatch with authenticated user');
    }
    const input = { ...dto, ownerId, ownerType };
    return await this.walletsService.creditWallet(input);
  }

  @Post('debit')
  @UseGuards(AuthenticationGuard)
  @ApiOperation({ summary: 'Debit wallet' })
  @ApiBody({ type: DebitWalletDto })
  @ApiResponse({ status: 200, description: 'Wallet debited', type: Wallet })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async debitWallet(
    @Body() dto: DebitWalletDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<Wallet> {
    const ownerType = determineOwnerTypeFromPermissions(user.permissions);
    const ownerId = user.userId;
    if (dto.ownerId && dto.ownerId !== ownerId) {
      throw new BadRequestException('ownerId mismatch with authenticated user');
    }
    if (dto.ownerType && dto.ownerType !== ownerType) {
      throw new BadRequestException('ownerType mismatch with authenticated user');
    }
    const input = { ...dto, ownerId, ownerType };
    return await this.walletsService.debitWallet(input);
  }

  @Post('transfer')
  @UseGuards(AuthenticationGuard)
  @ApiOperation({ summary: 'Transfer funds between wallets' })
  @ApiBody({
    schema: {
      example: {
        to: { ownerId: 'userId2', ownerType: WalletOwnerType.USER },
        amount: 1000
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Transfer successful' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async transfer(
    @Body() body: { to: { ownerId: string; ownerType: string }, amount: number },
    @CurrentUser() user: TokenPayload,
  ): Promise<{ success: boolean }> {
    const ownerType = determineOwnerTypeFromPermissions(user.permissions);
    const ownerId = user.userId;
    const from = { ownerId, ownerType };
    const to = { ownerId: body.to.ownerId, ownerType: body.to.ownerType as any };
    if (from.ownerId === to.ownerId && from.ownerType === to.ownerType) {
      throw new BadRequestException('Self-transfer is not allowed');
    }
    if (body.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }
    await this.walletsService.transfer(from, to, body.amount);
    return { success: true };
  }
}
