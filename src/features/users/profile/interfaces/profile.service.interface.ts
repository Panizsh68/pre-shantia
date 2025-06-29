import { ClientSession } from 'mongoose';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';

export interface IProfileService {
  create(createProfileDto: CreateProfileDto, session?: ClientSession);

  update(id: string, updateProfileDto: UpdateProfileDto);

  deleteByUserId(userId: string): Promise<void>;
}
