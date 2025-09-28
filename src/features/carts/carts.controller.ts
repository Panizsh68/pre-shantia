import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  UseGuards,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { TokenPayload } from '../auth/interfaces/token-payload.interface';
import { CreateCartDto } from './dto/create-cart.dto';
import { CartItemDto } from './dto/cart-item.dto';
import { Cart } from './entities/cart.entity';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { ICartsService } from './interfaces/carts-service.interface';
import { IProductService } from '../products/interfaces/product.service.interface';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateCartDto } from './dto/update-cart.dto';
import { PermissionsGuard } from '../permissions/guard/permission.guard';
import { Permission } from '../permissions/decorators/permissions.decorators';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';

@ApiTags('Carts')
@ApiBearerAuth()
@Controller('carts')
export class CartsController {
  constructor(
    @Inject('ICartsService') private readonly cartsService: ICartsService,
    @Inject('IProductsService') private readonly productsService: IProductService,
  ) { }

  @Get('active')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.CARTS, Action.READ)
  @ApiOperation({ summary: 'Get the active cart for current user' })
  @ApiResponse({ status: 200, description: 'User active cart returned', type: Cart })
  @HttpCode(HttpStatus.OK)
  getUserActiveCart(@CurrentUser() user: TokenPayload) {
    return this.cartsService.getUserActiveCart(user.userId);
  }

  @Get('populated')
  @UseGuards(AuthenticationGuard)
  @Permission(Resource.CARTS, Action.READ)
  @ApiOperation({ summary: 'Get carts with populated related data for current user' })
  @ApiResponse({ status: 200, description: 'Populated carts list returned', type: [Cart] })
  @HttpCode(HttpStatus.OK)
  getPopulatedCarts(@CurrentUser() user: TokenPayload) {
    return this.cartsService.getPopulatedCartsForUser(user.userId);
  }

  @Get('summary')
  @UseGuards(AuthenticationGuard)
  @Permission(Resource.CARTS, Action.READ)
  @ApiOperation({ summary: 'Get summary of user carts' })
  @ApiResponse({ status: 200, description: 'Cart summary returned', type: Object })
  @HttpCode(HttpStatus.OK)
  getSummary(@CurrentUser() user: TokenPayload) {
    return this.cartsService.getCartSummaryByUser(user.userId);
  }

  @Post()
  @UseGuards(AuthenticationGuard)
  @Permission(Resource.CARTS, Action.CREATE)
  @ApiOperation({ summary: 'Create a new cart' })
  @ApiBody({ type: CreateCartDto })
  @ApiResponse({ status: 201, description: 'Cart created', type: Cart })
  @HttpCode(HttpStatus.CREATED)
  createCart(@CurrentUser() user: TokenPayload, @Body() dto: CreateCartDto) {
    return this.cartsService.createCart({ ...dto, userId: user.userId });
  }

  @Post('items')
  @UseGuards(AuthenticationGuard)
  @Permission(Resource.CARTS, Action.CREATE)
  @ApiOperation({ summary: "Add item to user's cart" })
  @ApiBody({ type: CartItemDto })
  @ApiResponse({ status: 200, description: 'Item added to cart', type: Cart })
  @ApiResponse({ status: 400, description: 'Bad request - invalid companyId or product-company mismatch' })
  @ApiResponse({ status: 404, description: 'Product or active cart not found' })
  @HttpCode(HttpStatus.OK)
  async addItem(@CurrentUser() user: TokenPayload, @Body() item: CartItemDto) {
    // explicit ownership check: ensure product exists and belongs to provided companyId
    if (!item.companyId) throw new BadRequestException('companyId is required');
    const product = await this.productsService.findOne(item.productId);
    if (!product) throw new NotFoundException(`Product with id ${item.productId} not found`);
    // product.companyId may be an ObjectId; compare as strings
    if (product.companyId?.toString() !== item.companyId) {
      throw new BadRequestException('Product does not belong to the provided companyId');
    }
    return this.cartsService.addItemToCart(user.userId, item);
  }

  @Delete('items/:productId')
  @UseGuards(AuthenticationGuard)
  @Permission(Resource.CARTS, Action.DELETE)
  @ApiOperation({ summary: "Remove item from user's cart" })
  @ApiParam({ name: 'productId', description: 'ID of the product to remove' })
  @ApiResponse({ status: 200, description: 'Item removed from cart', type: Cart })
  @HttpCode(HttpStatus.OK)
  removeItem(@CurrentUser() user: TokenPayload, @Param('productId') productId: string) {
    return this.cartsService.removeItemFromCart(user.userId, productId);
  }

  @Delete('clear')
  @UseGuards(AuthenticationGuard)
  @Permission(Resource.CARTS, Action.DELETE)
  @ApiOperation({ summary: "Clear all items from user's cart" })
  @ApiResponse({ status: 200, description: 'Cart cleared', type: Cart })
  @HttpCode(HttpStatus.OK)
  clearCart(@CurrentUser() user: TokenPayload) {
    return this.cartsService.clearCart(user.userId);
  }

  @Post('checkout')
  @UseGuards(AuthenticationGuard)
  @Permission(Resource.CARTS, Action.UPDATE)
  @ApiOperation({ summary: "Checkout the user's cart" })
  @ApiResponse({ status: 200, description: 'Cart checked out successfully', type: Object })
  @HttpCode(HttpStatus.OK)
  checkout(@CurrentUser() user: TokenPayload) {
    return this.cartsService.checkout(user.userId);
  }

  @Patch()
  @UseGuards(AuthenticationGuard)
  @Permission(Resource.CARTS, Action.UPDATE)
  @ApiOperation({ summary: "Update the user's cart partially" })
  @ApiBody({ type: UpdateCartDto })
  @ApiResponse({ status: 200, description: 'Cart updated', type: Cart })
  @HttpCode(HttpStatus.OK)
  updateCart(@CurrentUser() user: TokenPayload, @Body() data: UpdateCartDto) {
    return this.cartsService.updateCart(user.userId, data);
  }
}
