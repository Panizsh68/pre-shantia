import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import mongoose, { DeleteResult } from 'mongoose';
import { Permissions } from './auth/decorators/permissions.decorator';
import { Action } from './auth/enums/actions.enum';
import { Resource } from './auth/enums/resources.enum';
import { AuthenticationGuard } from './auth/guards/auth.guard';
import { PermissionsGuard } from './auth/guards/permission.guard';
import { RequestContextPipe } from 'src/utils/pipes/request-context.pipe';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAllUsers() {
    return this.usersService.findAllUsers();
  }

  @Get(':id')
  findUserById(@Param('id') id: string) {
    return this.usersService.findUserById(id);
  }

  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Post()
  @UsePipes(RequestContextPipe)
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permissions([{ action: Action.create, resource: Resource.users }])
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto)
  }

  // @Delete(':id')
  // removeUser(@Param('id') id: string) {
  //   return this.usersService.removeUser(id);
  // }
}
