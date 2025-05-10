import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User,  } from './entities/user.entity';
import { Model } from 'mongoose';
import { IBaseRepository } from 'src/utils/base.repository';
import { IUserRepository } from './repositories/user.repository';
import { QueryOptionsDto } from 'src/utils/query-options.dto';

@Injectable()
export class UsersService {

  constructor(
    @Inject('UserRepository') private readonly usersRepository: IUserRepository,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.usersRepository.create(createUserDto);
    return user;
  }

  async findAll(options: QueryOptionsDto) {
    return await this.usersRepository.findAll(options);
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne(id)
    return user
  }

  async findUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const user = await this.usersRepository.findByPhoneNumber(phoneNumber);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.usersRepository.update(id , updateUserDto);
  }

  async remove(id: string) {
    await this.usersRepository.delete(id);
  }
}
