import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { IBaseCrudRepository } from 'src/libs/repository/interfaces/base-repo.interfaces';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';

export interface IUserRepository extends IBaseCrudRepository<User> {
  findByPhoneNumber(phoneNumber: string): Promise<User | null>;
}

@Injectable()
export class UserRepository extends BaseCrudRepository<User> implements IUserRepository {
  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.findOneByCondition({ phoneNumber });
  }
}
