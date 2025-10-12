import { DynamicModule, Module } from '@nestjs/common';
import Zibal from 'zibal';
import { ZibalService } from './zibal.service';
import { IZibalModuleOptions } from './interfaces/zibal-module-options.interface';
import { IZIBAL_SERVICE, ZIBAL_SDK } from './constants/zibal.constants';

@Module({})
export class ZibalModule {
  static register(options: IZibalModuleOptions): DynamicModule {
    // Initialize the SDK using its init method if available and provide the SDK object
    const sdk = Zibal as unknown;

    // If the SDK exposes an init function, call it with provided options.
    const sdkInitCandidate = (sdk as { init?: unknown }).init;
    let providedSdk = sdk;
    if (typeof sdkInitCandidate === 'function') {
      try {
        const maybeInitialized = (sdkInitCandidate as (opts: Record<string, unknown>) => unknown)({
          merchant: options.merchant,
          callbackUrl: options.callbackUrl,
          logLevel: options.logLevel,
          sandbox: options.sandbox,
        });
        // Some SDKs return an initialized instance; if so, use it.
        if (maybeInitialized) {
          providedSdk = maybeInitialized as unknown;
        }
        console.info('Zibal SDK init called');
      } catch (err) {
        console.warn('Zibal SDK init failed', { message: (err as Error).message, stack: (err as Error).stack });
      }
    } else {
      console.warn('Zibal SDK does not expose init(); proceeding with default export (may be uninitialized)');
    }

    return {
      module: ZibalModule,
      providers: [
        {
          provide: ZIBAL_SDK,
          useValue: providedSdk,
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
