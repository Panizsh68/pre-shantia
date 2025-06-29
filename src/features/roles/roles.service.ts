import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { IRole } from './interfaces/roles.interface';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role.name) private roleModel: Model<Role>) {}

  async createRole(role: CreateRoleDto): Promise<IRole> {
    const createdRole = await this.roleModel.create(role);
    return createdRole;
  }

  async getRoleById(roleId: string): Promise<IRole> {
    const role = await this.roleModel.findById(roleId);
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }
    return role;
  }

  async updateRole(roleId: string, role: Partial<CreateRoleDto>): Promise<IRole> {
    const updatedRole = await this.roleModel.findByIdAndUpdate(
      roleId,
      { $set: role },
      { new: true, runValidators: true },
    );
    if (!updatedRole) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }
    return updatedRole;
  }

  async deleteRole(roleId: string): Promise<void> {
    const result = await this.roleModel.findByIdAndDelete(roleId);
    if (!result) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }
  }

  async getAllRoles(): Promise<IRole[]> {
    const roles = await this.roleModel.find().exec();
    return roles;
  }

  async getRoleByName(name: string): Promise<IRole> {
    const role = await this.roleModel.findOne({ name });
    if (!role) {
      throw new NotFoundException(`Role with name ${name} not found`);
    }
    return role;
  }
}
