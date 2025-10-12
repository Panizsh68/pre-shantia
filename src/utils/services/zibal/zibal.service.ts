import { Inject, Injectable } from '@nestjs/common';
import Zibal from 'zibal';
import { ConfigService } from '@nestjs/config';
import { ZIBAL_SDK } from './constants/zibal.constants';
import { IZibalService } from './interfaces/zibal.service.interface';
import {
  InitiateZibalPaymentType,
  InitiateZibalPaymentResponseType,
} from './types/initiate.zibal.payment.type';
import {
  VerifyZibalPaymentRequestType,
  VerifyZibalPaymentResponseType,
} from './types/verify.zibal.payment.type';
import {
  ProcessRefundZibalType,
  ProcessRefundZibalResponseType,
} from './types/process-refund.zibal.type';

@Injectable()
export class ZibalService implements IZibalService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(ZIBAL_SDK) private readonly zibal: Zibal,
  ) { }

  async createPayment(
    dto: InitiateZibalPaymentType,
  ): Promise<InitiateZibalPaymentResponseType> {
    // zibal.request(amount, extras)
    const callbackUrl = this.configService.get<string>('ZIBAL_CALLBACK_URL') ?? dto.callbackUrl;
    if (!callbackUrl || typeof callbackUrl !== 'string' || callbackUrl.trim() === '') {
      // For payments we require a valid callback URL; defensive programming to avoid misrouted payments
      throw new Error('Missing Zibal callback URL (set ZIBAL_CALLBACK_URL or provide callbackUrl in DTO)');
    }

    const extras: { mobile?: string; description?: string; callbackUrl: string } = {
      mobile: dto.mobile,
      description: dto.description,
      callbackUrl,
    };

    const result = await this.zibal.request(dto.amount, extras);
    // SDK returns result.trackId (number) or track_id
    const trackId = String(result.trackId ?? result.track_id ?? '');
    const paymentUrl = typeof this.zibal.startURL === 'function' ? this.zibal.startURL(result.trackId ?? result.track_id) : '';
    return { trackId, paymentUrl, raw: result };
  }

  async verifyPayment(
    trackOrDto: VerifyZibalPaymentRequestType | string | number,
  ): Promise<VerifyZibalPaymentResponseType> {
    // Accept either a simple trackId or a request object
    let trackIdParam: string | number;
    if (typeof trackOrDto === 'string' || typeof trackOrDto === 'number') {
      trackIdParam = trackOrDto;
    } else {
      trackIdParam = trackOrDto.trackId;
    }

    // Prefer numeric id for SDK if possible
    const maybeNum = Number(trackIdParam);
    const trackArg: number | string = Number.isFinite(maybeNum) ? maybeNum : String(trackIdParam);

    try {
      const res = await this.zibal.verify(trackArg as any);

      // Map the SDK response into a normalized shape. Some SDKs swap `result`/`status` naming or use strings.
      const rawResult = res as any;
      const normalizedResult = Number(rawResult.result ?? rawResult.status ?? -1);
      const refNumber = String(rawResult.refNumber ?? rawResult.ref_id ?? rawResult.refnumber ?? '') || undefined;
      const paidAt = rawResult.paidAt ?? rawResult.paid_at;

      const mapped: VerifyZibalPaymentResponseType = {
        raw: res,
        // prefer numeric normalized result, but keep original strings if parsing failed
        result: Number.isFinite(normalizedResult) ? normalizedResult : rawResult.result ?? rawResult.status,
        status: rawResult.status ?? rawResult.result,
        refNumber,
        paidAt,
        amount: rawResult.amount,
      };

      // Structured log for auditing (server-side only)
      console.info('Zibal verify', { trackArg: String(trackArg), result: mapped.result, refNumber });

      return mapped;
    } catch (err) {
      // structured server-side logging for easier auditing and alerting
      console.error('Zibal SDK verify error', {
        trackId: String(trackIdParam),
        message: (err as Error).message,
        stack: (err as Error).stack,
      });
      throw new Error('Zibal verification failed');
    }
  }

  async refund(dto: ProcessRefundZibalType): Promise<ProcessRefundZibalResponseType> {
    // zibal may not support refund in same way; try to call refunds.create if exists
    const refundsCandidate = (this.zibal as unknown) as { refunds?: { create?: (d: ProcessRefundZibalType) => Promise<ProcessRefundZibalResponseType> } };
    if (refundsCandidate.refunds && typeof refundsCandidate.refunds.create === 'function') {
      try {
        const res = await refundsCandidate.refunds.create(dto);
        return res as ProcessRefundZibalResponseType;
      } catch (err) {
        console.error('Zibal refund error', {
          dto: { ...dto, cardNumber: undefined },
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        throw new Error('Zibal refund failed');
      }
    }

    // Explicit fallback: indicate the SDK does not support refunds via an exception so callers
    // can act (e.g., mark refund as manual or enqueue for human review). Returning a neutral
    // result risks false positives.
    throw new Error('Zibal SDK does not support refunds in this environment');
  }
}
