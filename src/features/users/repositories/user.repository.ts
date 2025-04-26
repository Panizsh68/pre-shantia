import { Injectable } from "@nestjs/common";
import { BaseRepository, IBaseRepository } from "src/utils/base.repository";
import { User } from "../entities/user.entity";
import { Model } from "mongoose";

export interface IUserRepository extends IBaseRepository<User> {
    findByPhoneNumber(phoneNumber: string): Promise<User | null>;
}

@Injectable()
export class UserRepository extends BaseRepository<User> {
    constructor(private readonly userModel: Model<User>) {
        super(userModel)
    }
    
    async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
        return this.userModel.findOne({ phoneNumber }).exec();
    }
}

