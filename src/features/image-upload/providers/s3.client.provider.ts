import { Provider } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { IMAGE_UPLOAD_TOKEN } from '../constants/image-upload.constants';

const logger = new Logger('S3ClientProvider');

export const S3ClientProvider: Provider = {
  provide: IMAGE_UPLOAD_TOKEN.S3_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    logger.log('[S3ClientProvider] Attempting to initialize S3 client...');

    // Try to get r2 config from nested config.r2
    let r2Config = configService.get('config.r2');
    logger.debug(`[S3ClientProvider] config.r2 result: ${r2Config ? 'found' : 'not found'}`);

    // Fallback: try to construct r2Config from flat keys if nested object not found
    if (!r2Config) {
      logger.warn('[S3ClientProvider] config.r2 not found, trying flat keys fallback...');
      const endpoint = configService.get('R2_ENDPOINT');
      const accessKey = configService.get('R2_ACCESS_KEY');
      const secretKey = configService.get('R2_SECRET_KEY');
      const bucket = configService.get('R2_BUCKET');
      const publicBaseUrl = configService.get('R2_PUBLIC_BASE_URL');

      if (endpoint || accessKey || secretKey || bucket) {
        logger.log('[S3ClientProvider] Constructing r2Config from flat keys');
        r2Config = { endpoint, accessKey, secretKey, bucket, publicBaseUrl };
      }
    }

    const endpoint = r2Config?.endpoint;
    const accessKeyId = r2Config?.accessKey;
    const secretAccessKey = r2Config?.secretKey;
    const bucket = r2Config?.bucket;

    logger.log(`[S3ClientProvider] R2 Config: endpoint=${endpoint ? '***configured***' : 'MISSING'}, accessKey=${accessKeyId ? '***configured***' : 'MISSING'}, secretKey=${secretAccessKey ? '***configured***' : 'MISSING'}, bucket=${bucket || 'MISSING'}`);

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      logger.warn('[S3ClientProvider] S3 client initialization skipped: missing credentials');
      logger.warn(`[S3ClientProvider] Missing: ${!endpoint ? 'endpoint' : ''} ${!accessKeyId ? 'accessKey' : ''} ${!secretAccessKey ? 'secretKey' : ''}`);
      return null;
    }

    logger.log('[S3ClientProvider] S3 client created successfully');
    return new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: false,
    });
  },
};
