import { Injectable } from '@nestjs/common';
import { User } from 'src/features/users/entities/user.entity';
import { BaseTransactionRepository } from 'src/libs/repository/base-repos';
import { IBaseTransactionRepository } from 'src/libs/repository/interfaces/base-repo.interfaces';

export interface IAuthRepository extends IBaseTransactionRepository<User> {}

@Injectable()
export class AuthRepository extends BaseTransactionRepository<User> implements IAuthRepository {}
