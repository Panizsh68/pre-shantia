import { IsMongoId, IsNumber, IsString, Min } from "class-validator";
import { Types } from "mongoose"

export class ZarinpalCreatePaymentDto {
    @IsNumber()
    @Min(0)
    amount: number;
  
    @IsMongoId()
    paymentId: Types.ObjectId;
  
    @IsString()
    currency: string;
  }