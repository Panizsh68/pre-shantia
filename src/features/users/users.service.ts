import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import mongoose, { DeleteResult, Model, UpdateResult } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userSchema: Model<User>) {}

  async createUser(createUserDto: CreateUserDto) {
    const user = await this.userSchema.create(createUserDto);
    await user.save();
    return user;
  }

  async findAllUsers() {
    return await this.userSchema.find();
  }

  async findUserById(id: string) {
    const user = await this.userSchema.findById(id)
    return user
  }

  async findUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const user = await this.userSchema.findOne({ phoneNumber });
    return user;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    await this.userSchema.findByIdAndUpdate(id , updateUserDto);
  }

  async removeUser(id: string) {
    await this.userSchema.findOneAndDelete({id: id});
  }
}
