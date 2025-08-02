import { Controller, Inject, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { IUsersService } from './interfaces/user.service.interface';
import { AuthenticationGuard } from '../auth/guards/auth.guard';

@ApiTags('users')
@UseGuards(AuthenticationGuard)
@Controller('users')
export class UsersController {
  constructor(@Inject('IUsersService') private readonly usersService: IUsersService) {}
}
