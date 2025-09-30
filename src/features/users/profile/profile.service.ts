import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
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
    const profileData: Partial<Profile> = {
      userId: createProfileDto.userId,
      phoneNumber: createProfileDto.phoneNumber,
      nationalId: createProfileDto.nationalId,
      walletId: createProfileDto.walletId,
      // populate required string fields with provided values or safe defaults
      firstName: createProfileDto.firstName ?? '',
      lastName: createProfileDto.lastName ?? '',
      email: createProfileDto.email ?? '',
      address: createProfileDto.address ?? '',
      cart: createProfileDto.cart,
      orders: createProfileDto.orders ?? [],
      transactions: createProfileDto.transactions ?? [],
      favorites: createProfileDto.favorites ?? [],
      companyId: createProfileDto.companyId ? new Types.ObjectId(createProfileDto.companyId) : undefined,
    };
    const creation = await this.profileRepository.createOne(profileData, session);
    return creation;
  }

  async getByUserId(userId: string): Promise<Profile | null> {
    return this.profileRepository.findOneByCondition({ userId } as any);
  }

  async update(id: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
    const updatedProfile: Partial<Profile> = {
      phoneNumber: updateProfileDto.phoneNumber,
      nationalId: updateProfileDto.nationalId,
      firstName: updateProfileDto.firstName,
      lastName: updateProfileDto.lastName,
      address: updateProfileDto.address,
      cart: updateProfileDto.cart,
      walletId: updateProfileDto.walletId,
      companyId: updateProfileDto.companyId ? new Types.ObjectId(updateProfileDto.companyId) : undefined,
    };
    const updatedProfileResult = await this.profileRepository.updateById(id, updatedProfile);
    return updatedProfileResult;
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const result = await this.profileRepository.deleteById(userId);
    return result;
  }
}
