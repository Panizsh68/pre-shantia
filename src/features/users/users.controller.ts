import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Permissions } from './auth/decorators/permissions.decorator';
import { Action } from './auth/enums/actions.enum';
import { Resource } from './auth/enums/resources.enum';
import { AuthenticationGuard } from './auth/guards/auth.guard';
import { PermissionsGuard } from './auth/guards/permission.guard';
import { RequestContextPipe } from 'src/utils/pipes/request-context.pipe';
import { QueryOptionsDto } from 'src/utils/query-options.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Body() options: QueryOptionsDto) {
    return this.usersService.findAll(options);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Post()
  @UsePipes(RequestContextPipe)
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permissions([{ action: Action.create, resource: Resource.users }])
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto)
  }
}
