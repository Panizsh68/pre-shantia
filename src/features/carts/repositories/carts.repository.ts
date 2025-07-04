// carts.repository.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { FilterQuery, Model, PipelineStage } from 'mongoose';
import { BaseCrudRepository } from 'src/libs/repository/base-repos/base-crud.repository';
import { Cart } from '../entities/cart.entity';
import {
  IBaseCrudRepository,
  IBasePopulateRepository,
  IBaseAggregateRepository,
} from 'src/libs/repository/interfaces/base-repo.interfaces';
import {
  FindOptions,
  PopulateOptions,
} from 'src/libs/repository/interfaces/base-repo-options.interface';
import { CartStatus } from '../enums/cart-status.enum';
import { ClientSession } from 'mongoose';

export interface ICartRepository
  extends IBaseCrudRepository<Cart>,
    IBasePopulateRepository<Cart>,
    IBaseAggregateRepository<Cart> {
  findActiveCartByUserId(userId: string): Promise<Cart>;
}

@Injectable()
export class CartRepository extends BaseCrudRepository<Cart> implements ICartRepository {
  constructor(
    cartModel: Model<Cart>,
    private readonly populateRepository: IBasePopulateRepository<Cart>,
    private readonly aggregateRepository: IBaseAggregateRepository<Cart>,
  ) {
    super(cartModel);
  }

  async findActiveCartByUserId(userId: string): Promise<Cart> {
    const condition: FilterQuery<Cart> = { userId, status: CartStatus.ACTIVE };
    const options: FindOptions = {
      populate: [
        { path: 'items.product', select: 'name price' },
        { path: 'items.companyId', select: 'name' },
      ],
      select: 'items totalPrice status userId',
    };
    const cart = await this.findOneByCondition(condition, options);
    if (!cart) {
      throw new NotFoundException(`Active cart for user ${userId} not found`);
    }
    return cart;
  }

  async populate(): Promise<Cart[]> {
    const carts = await this.findAll({});
    const fields: PopulateOptions[] = [
      { path: 'items.product', select: 'name price' },
      { path: 'items.companyId', select: 'name' },
    ];
    const populatedCarts = await this.populateRepository.populate(carts, fields);
    return populatedCarts;
  }

  async aggregate<R = Cart>(pipeline: PipelineStage[], session?: ClientSession): Promise<R[]> {
    const cartPipeline = [
      { $match: { status: CartStatus.ACTIVE } },
      ...pipeline,
      {
        $addFields: {
          computedTotal: {
            $sum: {
              $map: {
                input: '$items',
                as: 'item',
                in: { $multiply: ['$$item.priceAtAdd', '$$item.quantity'] },
              },
            },
          },
        },
      },
    ];

    const aggregation = this.aggregateRepository.aggregate<R>(cartPipeline);

    return aggregation;
  }
}
