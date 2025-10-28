import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { IUserRepository } from './repositories/user.repository';
import { FindManyOptions } from 'src/libs/repository/interfaces/base-repo-options.interface';
import { UpdateProfileDto } from './profile/dto/update-profile.dto';
import { IProfileService } from './profile/interfaces/profile.service.interface';
import { CreateProfileDto } from './profile/dto/create-profile.dto';
import { ClientSession } from 'mongoose';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { IPermission } from 'src/features/permissions/interfaces/permissions.interface';

@Injectable()
export class UsersService {
  constructor(
    @Inject('UserRepository') private readonly usersRepository: IUserRepository,
    @Inject('IProfileService') private readonly profileService: IProfileService,
    private readonly cacheService: CachingService,
    @Inject('ICompanyService') private readonly companiesService: import('../companies/interfaces/company.service.interface').ICompanyService,
  ) { }

  async findUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const user = await this.usersRepository.findByPhoneNumber(phoneNumber);
    return user;
  }

  async create(createUserDto: CreateUserDto, session?: ClientSession, options?: { createProfile?: boolean }): Promise<User> {
    const user = await this.usersRepository.createOne({ ...createUserDto }, session);
    if (options?.createProfile !== false) {
      // default behavior: create profile; pass strong-typed DTO
      const profileDto: CreateProfileDto = {
        ...createUserDto,
        userId: user.id.toString(),
      };
      await this.profileService.create(profileDto, session);
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

  async setPermissions(id: string, permissions: IPermission[]): Promise<User> {
    // Accept either a Mongo ObjectId or a phone number as identifier.
    let targetId = id;

    // If id is not a valid ObjectId, try to resolve by phone number
    if (!Types.ObjectId.isValid(id)) {
      const byPhone = await this.findUserByPhoneNumber(id);
      if (!byPhone) {
        throw new NotFoundException(`User with identifier ${id} not found`);
      }
      targetId = byPhone.id.toString();
    }

    // Ensure user exists before attempting update (avoid accidental create elsewhere)
    const existing = await this.findOne(targetId);

    // validate any scoped companyIds inside permissions before updating
    if (Array.isArray(permissions)) {
      for (const p of permissions) {
        if (p?.companyId) {
          try {
            await this.companiesService.findOne(p.companyId);
          } catch (err) {
            throw new NotFoundException(`Company with id ${p.companyId} not found`);
          }
        }
      }
    }

    // Merge incoming permissions with existing ones instead of replacing the whole array.
    // This preserves unrelated permissions and updates/creates entries for matching resource+companyId.
    const existingPermissions = Array.isArray(existing.permissions) ? [...existing.permissions] : [];

    const normalizeKey = (perm: IPermission) => `${perm.resource}::${perm.companyId ?? ''}`;

    const map = new Map<string, IPermission>();
    // start with existing permissions
    for (const ep of existingPermissions) {
      map.set(normalizeKey(ep), { ...ep });
    }
    // apply incoming permissions (replace actions for matching resource+companyId or add new)
    if (Array.isArray(permissions)) {
      for (const p of permissions) {
        const key = normalizeKey(p as IPermission);
        // replace or add
        map.set(key, { ...(map.get(key) || {} as IPermission), resource: p.resource, actions: p.actions, companyId: p.companyId });
      }
    }

    const mergedPermissions: IPermission[] = Array.from(map.values());

    const updated = await this.usersRepository.updateById(targetId, { permissions: mergedPermissions });
    if (!updated) {
      throw new NotFoundException(`User with ID ${targetId} doesn't exist`);
    }

    // invalidate cached permissions
    try {
      await this.cacheService.delete(`permissions:${existing.id}`);
    } catch (err) {
      // non-fatal: log and continue
      // eslint-disable-next-line no-console
      console.warn('Failed to clear permissions cache for user', existing.id, err?.message || err);
    }
    return updated;
  }
}
