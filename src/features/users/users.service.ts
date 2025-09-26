import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { IUserRepository } from './repositories/user.repository';
import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';
import { UpdateProfileDto } from './profile/dto/update-profile.dto';
import { IProfileService } from './profile/interfaces/profile.service.interface';
import { ClientSession } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(
    @Inject('UserRepository') private readonly usersRepository: IUserRepository,
    @Inject('IProfileService') private readonly profileService: IProfileService,
  ) { }

  async findUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const user = await this.usersRepository.findByPhoneNumber(phoneNumber);
    return user;
  }

  async create(createUserDto: CreateUserDto, session?: ClientSession, options?: { createProfile?: boolean }): Promise<User> {
    const user = await this.usersRepository.createOne({ ...createUserDto }, session);
    if (options?.createProfile !== false) {
      // default behavior: create profile
      await this.profileService.create(createUserDto, session);
    }
    return user;
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} doesn't exist`);
    }
    return user;
  }

  async findAll(options: FindManyOptions): Promise<User[]> {
    const users = await this.usersRepository.findAll(options);
    return users;
  }

  async update(id: string, updateUserDto: UpdateProfileDto): Promise<User> {
    const user = await this.usersRepository.updateById(id, updateUserDto);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} doesn't exist`);
    }
    await this.profileService.update(id, updateUserDto);
    return user;
  }

  async delete(id: string): Promise<void> {
    const user = await this.usersRepository.deleteById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} doesn't exist`);
    }
    await this.profileService.deleteByUserId(id);
  }
}
