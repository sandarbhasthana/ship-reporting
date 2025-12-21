import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createId } from '@paralleldrive/cuid2';
import * as path from 'path';
import { S3Config } from './s3.config';

export type FileCategory = 'logo' | 'signature' | 'profile';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private isEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const s3Config = this.configService.get<S3Config>('s3');

    this.isEnabled = s3Config?.enabled ?? false;
    this.bucketName = s3Config?.bucketName ?? '';

    if (this.isEnabled && s3Config) {
      const { accessKeyId, secretAccessKey, region } = s3Config;

      if (!accessKeyId || !secretAccessKey || !this.bucketName) {
        this.logger.warn(
          'S3 storage enabled but credentials are missing. Falling back to local storage.',
        );
        this.isEnabled = false;
      } else {
        this.s3Client = new S3Client({
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        this.logger.log(
          `S3 storage initialized for bucket: ${this.bucketName}`,
        );
      }
    }
  }

  /**
   * Check if S3 storage is enabled and configured
   */
  isS3Enabled(): boolean {
    return this.isEnabled && this.s3Client !== null;
  }

  /**
   * Generate S3 key path following Organization > User structure
   * Structure: organizations/{orgId}/logo/{filename} or
   *            organizations/{orgId}/users/{userId}/{category}/{filename}
   */
  private generateS3Key(
    category: FileCategory,
    organizationId: string,
    userId: string | null,
    originalFilename: string,
  ): string {
    const ext = path.extname(originalFilename);
    const uniqueFilename = `${createId()}${ext}`;

    if (category === 'logo') {
      // Organization logo: organizations/{orgId}/logo/{filename}
      return `organizations/${organizationId}/logo/${uniqueFilename}`;
    }

    // User files: organizations/{orgId}/users/{userId}/{category}/{filename}
    if (!userId) {
      throw new BadRequestException(
        'User ID is required for user file uploads',
      );
    }
    return `organizations/${organizationId}/users/${userId}/${category}/${uniqueFilename}`;
  }

  /**
   * Upload file to S3 with Organization > User folder structure
   */
  async uploadFile(
    file: Express.Multer.File,
    category: FileCategory,
    organizationId: string,
    userId: string | null = null,
  ): Promise<string> {
    if (!this.isS3Enabled()) {
      throw new BadRequestException('S3 storage is not enabled');
    }

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

    const s3Key = this.generateS3Key(
      category,
      organizationId,
      userId,
      file.originalname,
    );

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client!.send(command);
      this.logger.log(`File uploaded to S3: ${s3Key}`);

      // Return the S3 key (can be used to generate signed URLs later)
      return s3Key;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to upload file to S3: ${errorMessage}`);
      throw new BadRequestException('Failed to upload file to S3');
    }
  }

  /**
   * Generate a pre-signed URL for secure file access
   * @param s3Key - The S3 object key
   * @param expiresIn - URL expiration time in seconds (default: 1 hour)
   */
  async getSignedUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.isS3Enabled()) {
      throw new BadRequestException('S3 storage is not enabled');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      const signedUrl = await getSignedUrl(this.s3Client!, command, {
        expiresIn,
      });
      return signedUrl;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to generate signed URL: ${errorMessage}`);
      throw new BadRequestException('Failed to generate file URL');
    }
  }

  /**
   * Download a file from S3 as a Buffer
   * @param s3Key - The S3 object key
   * @returns Buffer containing the file data, or null if download fails
   */
  async downloadFile(s3Key: string): Promise<Buffer | null> {
    if (!this.isS3Enabled() || !s3Key) {
      return null;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      const response = await this.s3Client!.send(command);

      if (!response.Body) {
        return null;
      }

      // Convert the readable stream to a buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to download file from S3: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(s3Key: string): Promise<void> {
    if (!this.isS3Enabled() || !s3Key) {
      return;
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      await this.s3Client!.send(command);
      this.logger.log(`File deleted from S3: ${s3Key}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete file from S3: ${errorMessage}`);
    }
  }
}
