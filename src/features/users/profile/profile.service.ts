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
  ) {}

  async create(createProfileDto: CreateProfileDto, session?: ClientSession): Promise<Profile> {
    const profile: CreateProfileDto = {
      phoneNumber: createProfileDto.phoneNumber,
      nationalId: createProfileDto.nationalId,
    };
    const creation = await this.profileRepository.createOne(profile, session);
    return creation;
  }

  async getByUserId(userId: string): Promise<Profile | null> {
  return this.profileRepository.findById(userId);
}

  async update(id: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
    const updatedProfile: Partial<CreateProfileDto> = {
      phoneNumber: updateProfileDto.phoneNumber,
      nationalId: updateProfileDto.nationalId,
      firstName: updateProfileDto.firstName,
      lastName: updateProfileDto.lastName,
      address: updateProfileDto.address,
      cart: updateProfileDto.cart,
    };
    const updatedProfileResult = await this.profileRepository.updateById(id, updatedProfile);
    return updatedProfileResult;
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const result = await this.profileRepository.deleteById(userId);
    return result;
  }
}
