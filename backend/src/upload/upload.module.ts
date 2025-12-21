import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
    }),
    S3Module,
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
