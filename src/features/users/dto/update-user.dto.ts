import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import mongoose from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @ApiProperty()
    id: string
}
