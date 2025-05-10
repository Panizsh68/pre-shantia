import { IsMongoId, IsNumber, IsString, Min } from "class-validator"
import { Types } from "mongoose"

export class InitiatePaymentDto {
    @IsMongoId()
    userId: Types.ObjectId 

    @IsMongoId()
    orderId: Types.ObjectId;
  
    @IsMongoId()
    companyId: Types.ObjectId;

    @IsNumber()
    @Min(0)
    amount: number

    @IsString()
    currency: string
}
