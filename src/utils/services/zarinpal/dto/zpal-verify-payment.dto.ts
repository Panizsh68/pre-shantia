import { IsNumber, IsString, Min } from "class-validator";

export class ZarinpalVerifyPaymentDto {
    @IsString()
    authority: string;
  
    @IsNumber()
    @Min(0)
    amount: number;
  }