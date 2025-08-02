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
import { UpdateCartDto } from './dto/update-cart.dto';

@ApiTags('Carts')
@ApiBearerAuth()
@UseGuards(AuthenticationGuard)
@Controller('carts')
export class CartsController {
  constructor(@Inject('ICartsService') private readonly cartsService: ICartsService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get the active cart for current user' })
  @ApiResponse({ status: 200, description: 'User active cart returned', type: Cart })
  @HttpCode(HttpStatus.OK)
  getUserActiveCart(@CurrentUser() user: TokenPayload) {
    return this.cartsService.getUserActiveCart(user.userId);
  }

  @Get('populated')
  @ApiOperation({ summary: 'Get carts with populated related data for current user' })
  @ApiResponse({ status: 200, description: 'Populated carts list returned', type: [Cart] })
  @HttpCode(HttpStatus.OK)
  getPopulatedCarts(@CurrentUser() user: TokenPayload) {
    return this.cartsService.getPopulatedCartsForUser(user.userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get summary of user carts' })
  @ApiResponse({ status: 200, description: 'Cart summary returned', type: Object })
  @HttpCode(HttpStatus.OK)
  getSummary(@CurrentUser() user: TokenPayload) {
    return this.cartsService.getCartSummaryByUser(user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new cart' })
  @ApiBody({ type: CreateCartDto })
  @ApiResponse({ status: 201, description: 'Cart created', type: Cart })
  @HttpCode(HttpStatus.CREATED)
  createCart(@CurrentUser() user: TokenPayload, @Body() dto: CreateCartDto) {
    return this.cartsService.createCart({ ...dto, userId: user.userId });
  }

  @Post('items')
  @ApiOperation({ summary: "Add item to user's cart" })
  @ApiBody({ type: CartItemDto })
  @ApiResponse({ status: 200, description: 'Item added to cart', type: Cart })
  @HttpCode(HttpStatus.OK)
  addItem(@CurrentUser() user: TokenPayload, @Body() item: CartItemDto) {
    return this.cartsService.addItemToCart(user.userId, item);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: "Remove item from user's cart" })
  @ApiParam({ name: 'productId', description: 'ID of the product to remove' })
  @ApiResponse({ status: 200, description: 'Item removed from cart', type: Cart })
  @HttpCode(HttpStatus.OK)
  removeItem(@CurrentUser() user: TokenPayload, @Param('productId') productId: string) {
    return this.cartsService.removeItemFromCart(user.userId, productId);
  }

  @Delete('clear')
  @ApiOperation({ summary: "Clear all items from user's cart" })
  @ApiResponse({ status: 200, description: 'Cart cleared', type: Cart })
  @HttpCode(HttpStatus.OK)
  clearCart(@CurrentUser() user: TokenPayload) {
    return this.cartsService.clearCart(user.userId);
  }

  @Post('checkout')
  @ApiOperation({ summary: "Checkout the user's cart" })
  @ApiResponse({ status: 200, description: 'Cart checked out successfully', type: Object })
  @HttpCode(HttpStatus.OK)
  checkout(@CurrentUser() user: TokenPayload) {
    return this.cartsService.checkout(user.userId);
  }

  @Patch()
  @ApiOperation({ summary: "Update the user's cart partially" })
  @ApiBody({ type: UpdateCartDto })
  @ApiResponse({ status: 200, description: 'Cart updated', type: Cart })
  @HttpCode(HttpStatus.OK)
  updateCart(@CurrentUser() user: TokenPayload, @Body() data: UpdateCartDto) {
    return this.cartsService.updateCart(user.userId, data);
  }
}
