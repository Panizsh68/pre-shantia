import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from '../profile/dto/update-profile.dto';
import { ClientSession } from 'mongoose';

export interface IUsersService {
  findUserByPhoneNumber(phoneNumber: string): Promise<User | null>;

  create(createUserDto: CreateUserDto, session?: ClientSession): Promise<User>;

  findOne(id: string): Promise<User>;

  findAll(options: FindManyOptions): Promise<User[]>;

  update(id: string, updateUserDto: UpdateProfileDto): Promise<User>;

  delete(id: string): Promise<void>;

  getUserRoles(id: string): Promise<string[]>;

  assignRole(id: string, roleName: string, session?: ClientSession): Promise<User>;

  removeRole(id: string, roleName: string): Promise<User>;
}
