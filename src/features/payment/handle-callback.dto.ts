import { ApiProperty } from '@nestjs/swagger';
import { InitiatePaymentResponseDto } from 'src/utils/services/zarinpal/dtos';
import { InitiateZarinpalPaymentResponseType } from 'src/utils/services/zarinpal/types';

export class HandleCallbackResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Payment verified successfully' })
  message: string;

  @ApiProperty({
    type: InitiatePaymentResponseDto,
  })
  data: InitiatePaymentResponseDto;
}
