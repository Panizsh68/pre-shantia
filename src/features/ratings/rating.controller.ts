import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Inject,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { CreateRatingDto } from './dto/create-rating.dto';
import { IRatingService } from './interfaces/rating.service.interface';
import { AuthenticationGuard } from 'src/features/auth/guards/auth.guard';
import { Permission } from '../permissions/decoratorss/permissions.decorators';
import { PermissionsGuard } from '../permissions/guard/permission.guard';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { TokenPayload } from 'src/features/auth/interfaces/token-payload.interface';

@ApiTags('Ratings')
@ApiBearerAuth()
@Controller('ratings')
export class RatingController {
  constructor(
    @Inject('IRatingService')
    private readonly ratingService: IRatingService,
  ) { }

  @Post()
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.RATINGS, Action.DEFAULT)
  @ApiOperation({ summary: 'Create or update a rating for a product', description: 'This route is open for default users.' })
  @ApiBody({ type: CreateRatingDto })
  @ApiResponse({ status: 201, description: 'Rating created/updated', type: Object })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async rateProduct(
    @CurrentUser() user: TokenPayload,
    @Body() dto: CreateRatingDto,
  ) {
    return await this.ratingService.rateProduct(user.userId, dto);
  }

  @Get('product/:productId')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.RATINGS, Action.DEFAULT)
  @ApiOperation({ summary: 'Get all ratings for a product', description: 'This route is open for default users.' })
  @ApiParam({ name: 'productId', type: String })
  @ApiResponse({ status: 200, description: 'Ratings returned', type: [Object] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProductRatings(@Param('productId') productId: string) {
    return await this.ratingService.getProductRatings(productId);
  }

  @Get('product/:productId/average')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.RATINGS, Action.DEFAULT)
  @ApiOperation({ summary: 'Get average rating for a product', description: 'This route is open for default users.' })
  @ApiParam({ name: 'productId', type: String })
  @ApiResponse({ status: 200, description: 'Average rating returned', schema: { example: { average: 4.5 } } })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProductAverageRating(@Param('productId') productId: string) {
    return { average: await this.ratingService.getProductAverageRating(productId) };
  }

  @Get('product/:productId/count')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.RATINGS, Action.DEFAULT)
  @ApiOperation({ summary: 'Get ratings count for a product', description: 'This route is open for default users.' })
  @ApiParam({ name: 'productId', type: String })
  @ApiResponse({ status: 200, description: 'Ratings count returned', schema: { example: { count: 12 } } })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProductRatingsCount(@Param('productId') productId: string) {
    return { count: await this.ratingService.getProductRatingsCount(productId) };
  }

  @Get('product/:productId/user/:userId')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.RATINGS, Action.DEFAULT)
  @ApiOperation({ summary: 'Get a user\'s rating for a product', description: 'This route is open for default users.' })
  @ApiParam({ name: 'productId', type: String })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: 200, description: 'User rating returned', type: Object })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserProductRating(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
  ) {
    return await this.ratingService.getUserProductRating(userId, productId);
  }

  @Patch('product/:productId')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.RATINGS, Action.DEFAULT)
  @ApiOperation({ summary: 'Update a user\'s rating for a product', description: 'This route is open for default users.' })
  @ApiParam({ name: 'productId', type: String })
  @ApiBody({ type: CreateRatingDto })
  @ApiResponse({ status: 200, description: 'Rating updated', type: Object })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProductRating(
    @CurrentUser() user: TokenPayload,
    @Param('productId') productId: string,
    @Body() dto: CreateRatingDto,
  ) {
    return await this.ratingService.updateProductRating(user.userId, { ...dto, productId });
  }

  @Delete('product/:productId')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.RATINGS, Action.DEFAULT)
  @ApiOperation({ summary: 'Delete a user\'s rating for a product', description: 'This route is open for default users.' })
  @ApiParam({ name: 'productId', type: String })
  @ApiResponse({ status: 204, description: 'Rating deleted' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProductRating(
    @CurrentUser() user: TokenPayload,
    @Param('productId') productId: string,
  ) {
    await this.ratingService.deleteProductRating(user.userId, productId);
  }
}
