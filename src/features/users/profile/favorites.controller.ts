import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { AuthenticationGuard } from 'src/features/auth/guards/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { TokenPayload } from 'src/features/auth/interfaces/token-payload.interface';
import { IProfileService } from './interfaces/profile.service.interface';
import { IProductService } from 'src/features/products/interfaces/product.service.interface';

interface FavoriteRequest {
  productId: string;
}

@ApiTags('Favorites')
@ApiBearerAuth()
@Controller('favorites')
@UseGuards(AuthenticationGuard)
export class FavoritesController {
  constructor(
    @Inject('IProfileService') private readonly profileService: IProfileService,
    @Inject('IProductsService') private readonly productsService: IProductService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List the current user favorites' })
  async list(@CurrentUser() user: TokenPayload) {
    const profile = await this.profileService.getByUserId(user.userId);
    if (!profile) return [];

    const productIds = Array.isArray(profile.favorites) ? profile.favorites : [];
    const favorites = await Promise.all(
      productIds.map(async (productId) => {
        try {
          const product = await this.productsService.findOne(productId);
          return { id: productId, productId, product };
        } catch {
          // Do not make the whole favorites page fail if a product was
          // deleted or became unavailable after it was favorited.
          return { id: productId, productId };
        }
      }),
    );

    return favorites;
  }

  @Post()
  @ApiOperation({ summary: 'Add a product to the current user favorites' })
  async add(
    @CurrentUser() user: TokenPayload,
    @Body() body: FavoriteRequest,
  ) {
    if (!body?.productId || !Types.ObjectId.isValid(body.productId)) {
      throw new BadRequestException('A valid productId is required');
    }

    const product = await this.productsService.findOne(body.productId);
    const profile = await this.profileService.getByUserId(user.userId);
    if (!profile) {
      throw new NotFoundException(`Profile for user ${user.userId} not found`);
    }

    const productId = String(body.productId);
    const favorites = Array.isArray(profile.favorites)
      ? profile.favorites.map(String)
      : [];
    const nextFavorites = favorites.includes(productId)
      ? favorites
      : [...favorites, productId];

    if (nextFavorites.length !== favorites.length) {
      await this.profileService.updateFavorites(user.userId, nextFavorites);
    }

    return { id: productId, productId, product };
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a product from the current user favorites' })
  async remove(
    @CurrentUser() user: TokenPayload,
    @Param('productId') productId: string,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('A valid productId is required');
    }

    const profile = await this.profileService.getByUserId(user.userId);
    if (!profile) return;

    const nextFavorites = (Array.isArray(profile.favorites) ? profile.favorites : [])
      .map(String)
      .filter((id) => id !== productId);

    await this.profileService.updateFavorites(user.userId, nextFavorites);
  }
}
