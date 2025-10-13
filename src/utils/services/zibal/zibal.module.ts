import { DynamicModule, Module } from '@nestjs/common';
import Zibal from 'zibal';
import { ZibalService } from './zibal.service';
import { IZibalModuleOptions } from './interfaces/zibal-module-options.interface';
import { IZIBAL_SERVICE, ZIBAL_SDK } from './constants/zibal.constants';

@Module({})
export class ZibalModule {
  static register(options: IZibalModuleOptions): DynamicModule {
    // Create new instance of Zibal SDK with options
    const sdk = new Zibal({
      merchant: options.merchant,
      callbackUrl: options.callbackUrl,
      sandbox: options.sandbox,
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
