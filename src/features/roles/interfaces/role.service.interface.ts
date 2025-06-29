import { CreateRoleDto } from '../dto/create-role.dto';
import { Role } from '../entities/role.entity';

export interface IRolesService {
  createRole(role: CreateRoleDto): Promise<Role>;

  getRoleById(roleId: string): Promise<Role>;

  updateRole(roleId: string, role: Partial<CreateRoleDto>): Promise<Role>;

  deleteRole(roleId: string): Promise<void>;

  getAllRoles(): Promise<Role[]>;

  getRoleByName(name: string): Promise<Role>;
}
