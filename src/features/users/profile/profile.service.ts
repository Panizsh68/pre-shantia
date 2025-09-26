import { Inject, Injectable } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';
import { IProfileRepository } from './repositories/profille.repository';
import { ClientSession } from 'mongoose';

@Injectable()
export class ProfileService {
  constructor(
    @Inject('ProfileRepository') private readonly profileRepository: IProfileRepository,
  ) { }

  async create(createProfileDto: CreateProfileDto, session?: ClientSession): Promise<Profile> {
    // userId is required on the DTO (strongly typed) to guarantee link to User
    const profileData: Partial<CreateProfileDto> = {
      userId: createProfileDto.userId,
      phoneNumber: createProfileDto.phoneNumber,
      nationalId: createProfileDto.nationalId,
      walletId: createProfileDto.walletId,
      firstName: createProfileDto.firstName,
      lastName: createProfileDto.lastName,
      address: createProfileDto.address,
      cart: createProfileDto.cart,
      orders: createProfileDto.orders,
      transactions: createProfileDto.transactions,
      favorites: createProfileDto.favorites,
    };
    const creation = await this.profileRepository.createOne(profileData as any, session);
    return creation;
  }

  async getByUserId(userId: string): Promise<Profile | null> {
    return this.profileRepository.findOneByCondition({ userId } as any);
  }

  async update(id: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
    const updatedProfile: Partial<CreateProfileDto & UpdateProfileDto> = {
      phoneNumber: updateProfileDto.phoneNumber,
      nationalId: updateProfileDto.nationalId,
      firstName: updateProfileDto.firstName,
      lastName: updateProfileDto.lastName,
      address: updateProfileDto.address,
      cart: updateProfileDto.cart,
      walletId: updateProfileDto.walletId,
    };
    const updatedProfileResult = await this.profileRepository.updateById(id, updatedProfile);
    return updatedProfileResult;
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const result = await this.profileRepository.deleteById(userId);
    return result;
  }
}
