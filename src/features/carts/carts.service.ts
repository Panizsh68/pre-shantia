import { Inject, Injectable } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { ICartRepository } from './repositories/carts.repository';
import { Cart } from './entities/cart.entity';
import { QueryOptionsDto } from 'src/utils/query-options.dto';

@Injectable()
export class CartsService {
  constructor(@Inject('CartRepository') private readonly cartRepository: ICartRepository) {}

  async create(createCartDto: CreateCartDto): Promise<Cart> {
    return await this.cartRepository.create(createCartDto);
  }

  async findAll(options: QueryOptionsDto): Promise<Cart[]> {
    return await this.cartRepository.findAll(options);
  }

  async findOne(id: string): Promise<Cart | null> {
    return await this.cartRepository.findOne(id);
  }

  async update(id: string, updateCartDto: UpdateCartDto): Promise<Cart | null> {
    return await this.cartRepository.update(id, updateCartDto);
  }

  async remove(id: string): Promise<boolean> {
    return await this.cartRepository.delete(id);
  }
}
