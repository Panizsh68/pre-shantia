import { ClientSession } from 'mongoose';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { Profile } from '../entities/profile.entity';

export interface IProfileService {
  create(createProfileDto: CreateProfileDto, session?: ClientSession): Promise<Profile>;

  getByUserId(userId: string): Promise<Profile | null>;

  update(id: string, updateProfileDto: UpdateProfileDto): Promise<Profile>;

  deleteByUserId(userId: string): Promise<boolean>;
}
