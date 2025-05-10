import { Types } from "mongoose";
import { TransactionType } from "../enums/transaction-type.enum";
import { TransactionStatus } from "../enums/transaction.status.enum";
import { IsEnum, IsMongoId, IsNumber, IsOptional } from "class-validator";

export class CreateTransactionDto {
    @IsMongoId()
    userId: Types.ObjectId;
  
    @IsMongoId()
    paymentId: Types.ObjectId;
  
    @IsNumber()
    amount: number;
  
    @IsEnum(TransactionType)
    type: TransactionType;
  
    @IsEnum(TransactionStatus)
    status: TransactionStatus;
  }
