import { DynamicModule, Module } from '@nestjs/common';
import Zarinpal from 'zarinpal-node-sdk';
import { ZarinpalService } from './zarinpal.service';
import { IZarinpalModuleOptions } from './interfaces/zarinpal-modules-options.interface';
import { IZARINPAL_SERVICE, ZARINPAL_SDK } from './constants/zarinpal.constants';

@Module({})
export class ZarinpalModule {
  static register(options: IZarinpalModuleOptions): DynamicModule {
    return {
      module: ZarinpalModule,
      providers: [
        {
          provide: ZARINPAL_SDK,
          useValue: new Zarinpal(options),
        },
        {
          provide: IZARINPAL_SERVICE,
          useClass: ZarinpalService,
        },
      ],
      exports: [ZARINPAL_SDK, IZARINPAL_SERVICE],
    };
  }
}
