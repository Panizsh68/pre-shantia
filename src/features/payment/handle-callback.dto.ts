import { ApiProperty } from '@nestjs/swagger';
import { InitiatePaymentResponseDto } from 'src/utils/services/zibal/dtos/initiate.zibal.payment.dto';
import { InitiateZibalPaymentResponseType } from 'src/utils/services/zibal/types';

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
