import { IsMongoId, IsNumber } from "class-validator";
import { Types } from "mongoose"

export class CreditWalletDto {
    @IsMongoId()
    ownerId: Types.ObjectId;
  
    @IsNumber()
    amount: number;
}