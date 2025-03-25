import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class RequestContextPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Get the request object from metadata (it should be available in context)
    const request: Request = metadata?.metatype?.prototype?.constructor;

    // Access the userAgent and ip from the request context
    const userAgent = request?.['context']?.userAgent || 'Unknown User-Agent';
    const ip = request?.['context']?.ip || 'Unknown IP';

    // If both userAgent and ip exist, add them to the body
    if (userAgent && ip) {
      return { ...value, userAgent, ip };
    }

    // Otherwise, return the value as it is
    return value;
  }
}
