import { DynamicModule, Module } from '@nestjs/common';
import Zibal from 'zibal';
import { ZibalService } from './zibal.service';
import { IZibalModuleOptions } from './interfaces/zibal-module-options.interface';
import { IZIBAL_SERVICE, ZIBAL_SDK } from './constants/zibal.constants';

@Module({})
export class ZibalModule {
  static register(options: IZibalModuleOptions): DynamicModule {
    // zibal@1.x selects its sandbox by using the special `zibal` merchant.
    // The SDK does not consume a `sandbox` constructor option, so passing it
    // through silently leaves a sandbox request on the production merchant.
    const configuredMerchant = String(options.merchant ?? '').trim();
    const merchant = options.sandbox === true ? 'zibal' : configuredMerchant;

    const sdk = new Zibal({
      merchant,
      callbackUrl: options.callbackUrl?.trim(),
    });

    return {
      module: ZibalModule,
      providers: [
        {
          provide: ZIBAL_SDK,
          useValue: sdk,
        },
        {
          provide: IZIBAL_SERVICE,
          useClass: ZibalService,
        },
      ],
      exports: [ZIBAL_SDK, IZIBAL_SERVICE],
    };
  }
}
