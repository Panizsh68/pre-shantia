import { Controller, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { IUsersService } from './interfaces/user.service.interface';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(@Inject('IUsersService') private readonly usersService: IUsersService) {}
}
