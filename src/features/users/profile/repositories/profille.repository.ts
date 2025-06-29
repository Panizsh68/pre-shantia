import { Injectable } from '@nestjs/common';
import { IBaseCrudRepository } from 'src/libs/repository/interfaces/base-repo.interfaces';
import { Profile } from '../entities/profile.entity';
import { BaseCrudRepository } from 'src/libs/repository/base-repos';

export interface IProfileRepository extends IBaseCrudRepository<Profile> {}

@Injectable()
export class ProfileRepository extends BaseCrudRepository<Profile> implements IProfileRepository {}
