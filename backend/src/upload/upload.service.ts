import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { createId } from '@paralleldrive/cuid2';
import 'multer';

@Injectable()
export class UploadService {
  private uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir =
      this.configService.get<string>('UPLOAD_DIR') || './uploads';
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    const dirs = ['logos', 'signatures'];
    dirs.forEach((dir) => {
      const fullPath = path.join(this.uploadDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: 'logos' | 'signatures',
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

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${createId()}${ext}`;
    const filePath = path.join(this.uploadDir, folder, filename);

    // Save file
    await fs.promises.writeFile(filePath, file.buffer);

    // Return relative path for storage in DB
    return `/uploads/${folder}/${filename}`;
  }

  async deleteFile(filePath: string): Promise<void> {
    if (!filePath) return;

    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }

  getFilePath(relativePath: string): string {
    return path.join(process.cwd(), relativePath);
  }
}
