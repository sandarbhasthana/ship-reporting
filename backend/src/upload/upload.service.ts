import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { createId } from '@paralleldrive/cuid2';
import 'multer';
import { S3Service, FileCategory } from '../s3/s3.service';

export type UploadFolder = 'logos' | 'signatures' | 'profile-images';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private uploadDir: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
  ) {
    this.uploadDir =
      this.configService.get<string>('UPLOAD_DIR') || './uploads';
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    const dirs = ['logos', 'signatures', 'profile-images'];
    dirs.forEach((dir) => {
      const fullPath = path.join(this.uploadDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  /**
   * Map upload folder to S3 category
   */
  private mapFolderToCategory(folder: UploadFolder): FileCategory {
    const mapping: Record<UploadFolder, FileCategory> = {
      logos: 'logo',
      signatures: 'signature',
      'profile-images': 'profile',
    };
    return mapping[folder];
  }

  /**
   * Upload file with S3 support (falls back to local storage if S3 is disabled)
   * S3 path structure: organizations/{orgId}/users/{userId}/{category}/{filename}
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: UploadFolder,
    organizationId?: string,
    userId?: string,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Try S3 upload if enabled and organizationId is provided
    if (this.s3Service.isS3Enabled() && organizationId) {
      try {
        const category = this.mapFolderToCategory(folder);
        const s3Key = await this.s3Service.uploadFile(
          file,
          category,
          organizationId,
          userId || null,
        );
        this.logger.log(`File uploaded to S3: ${s3Key}`);
        // Return S3 key prefixed with 's3://' to distinguish from local paths
        return `s3://${s3Key}`;
      } catch (error) {
        this.logger.warn(
          `S3 upload failed, falling back to local storage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    // Fallback to local storage
    return this.uploadToLocal(file, folder);
  }

  /**
   * Upload file to local storage (original implementation)
   */
  private async uploadToLocal(
    file: Express.Multer.File,
    folder: UploadFolder,
  ): Promise<string> {
    const ext = path.extname(file.originalname);
    const filename = `${createId()}${ext}`;
    const filePath = path.join(this.uploadDir, folder, filename);

    await fs.promises.writeFile(filePath, file.buffer);
    this.logger.log(`File uploaded to local storage: ${filePath}`);

    return `/uploads/${folder}/${filename}`;
  }

  /**
   * Get URL for accessing a file (supports both S3 and local paths)
   */
  async getFileUrl(filePath: string): Promise<string> {
    if (!filePath) {
      throw new BadRequestException('File path is required');
    }

    // Check if it's an S3 path
    if (filePath.startsWith('s3://')) {
      const s3Key = filePath.replace('s3://', '');
      return this.s3Service.getSignedUrl(s3Key);
    }

    // Return local path as-is (will be served by static files middleware)
    return filePath;
  }

  /**
   * Delete a file (supports both S3 and local storage)
   */
  async deleteFile(filePath: string): Promise<void> {
    if (!filePath) return;

    // Check if it's an S3 path
    if (filePath.startsWith('s3://')) {
      const s3Key = filePath.replace('s3://', '');
      await this.s3Service.deleteFile(s3Key);
      return;
    }

    // Delete from local storage
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      this.logger.log(`File deleted from local storage: ${fullPath}`);
    }
  }

  /**
   * Check if S3 storage is enabled
   */
  isS3Enabled(): boolean {
    return this.s3Service.isS3Enabled();
  }

  getFilePath(relativePath: string): string {
    return path.join(process.cwd(), relativePath);
  }
}
