import { registerAs } from '@nestjs/config';

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
  enabled: boolean;
}

export default registerAs(
  's3',
  (): S3Config => ({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    bucketName: process.env.AWS_S3_BUCKET_NAME || '',
    enabled: process.env.USE_S3_STORAGE === 'true',
  }),
);
