import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { Role } from './entities/role.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { IRole } from './interfaces/roles.interface';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({ status: 201, description: 'Role created successfully', type: Role })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createRoleDto: CreateRoleDto): Promise<IRole> {
    const role = await this.rolesService.createRole(createRoleDto);
    return role;
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'List of roles', type: [Role] })
  async findAll(): Promise<IRole[]> {
    const roles = await this.rolesService.getAllRoles();
    return roles;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a role by ID' })
  @ApiParam({ name: 'id', description: 'Role ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Role found', type: Role })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findOne(@Param('id') id: string): Promise<IRole> {
    const role = await this.rolesService.getRoleById(id);
    return role;
  }

  @Get('name/:name')
  @ApiOperation({ summary: 'Get a role by name' })
  @ApiParam({ name: 'name', description: 'Role name', example: 'admin' })
  @ApiResponse({ status: 200, description: 'Role found', type: Role })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findByName(@Param('name') name: string): Promise<IRole> {
    const role = await this.rolesService.getRoleByName(name);
    return role;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a role by ID' })
  @ApiParam({ name: 'id', description: 'Role ID', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: CreateRoleDto, description: 'Partial role data to update' })
  @ApiResponse({ status: 200, description: 'Role updated successfully', type: Role })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: Partial<CreateRoleDto>,
  ): Promise<IRole> {
    const updatedRole = await this.rolesService.updateRole(id, updateRoleDto);
    return updatedRole;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a role by ID' })
  @ApiParam({ name: 'id', description: 'Role ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 204, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.rolesService.deleteRole(id);
  }
}
