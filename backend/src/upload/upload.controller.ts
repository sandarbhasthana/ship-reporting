import {
  Controller,
  Post,
  Get,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleName } from '@ship-reporting/prisma';
import { PrismaService } from '../prisma/prisma.service';
import 'multer';

/**
 * Upload API - Supports both local storage and AWS S3
 *
 * File Storage Structure:
 * - S3: organizations/{orgId}/logo/{filename} (for org logos)
 * - S3: organizations/{orgId}/users/{userId}/{type}/{filename} (for user files)
 * - Local: /uploads/{type}/{filename} (fallback when S3 is not configured)
 *
 * Supported file types: JPEG, PNG, GIF, WebP
 * Maximum file size: 5MB
 */
@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
@UseGuards(RolesGuard)
@ApiExtraModels()
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('logo')
  @Roles(RoleName.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload organization logo',
    description: `Uploads an organization logo image. Requires ADMIN role.

**Storage Path:**
- S3: \`organizations/{orgId}/logo/{filename}\`
- Local: \`/uploads/logos/{filename}\`

**Constraints:**
- File types: JPEG, PNG, GIF, WebP
- Max size: 5MB`,
  })
  @ApiBody({
    description: 'Image file to upload',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, GIF, or WebP)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Logo uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path (S3 key or local path)',
          example: 'organizations/abc123/logo/xyz789.png',
        },
        storage: {
          type: 'string',
          enum: ['s3', 'local'],
          description: 'Storage backend used',
          example: 's3',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or missing organization context',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    if (!organizationId) {
      throw new BadRequestException('Organization context required');
    }

    // Upload with organization context (S3 path: organizations/{orgId}/logo/{filename})
    const filePath = await this.uploadService.uploadFile(
      file,
      'logos',
      organizationId,
    );

    // Update organization logo
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { logo: filePath },
    });

    return {
      path: filePath,
      storage: this.uploadService.isS3Enabled() ? 's3' : 'local',
    };
  }

  @Post('signature')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload user signature',
    description: `Uploads a user's signature image for document signing.

**Storage Path:**
- S3: \`organizations/{orgId}/users/{userId}/signature/{filename}\`
- Local: \`/uploads/signatures/{filename}\`

**Constraints:**
- File types: JPEG, PNG, GIF, WebP
- Max size: 5MB`,
  })
  @ApiBody({
    description: 'Signature image file to upload',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, GIF, or WebP)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Signature uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path (S3 key or local path)',
          example: 'organizations/abc123/users/user456/signature/xyz789.png',
        },
        storage: {
          type: 'string',
          enum: ['s3', 'local'],
          description: 'Storage backend used',
          example: 's3',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadSignature(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    // Upload with organization and user context
    // S3 path: organizations/{orgId}/users/{userId}/signature/{filename}
    const filePath = await this.uploadService.uploadFile(
      file,
      'signatures',
      organizationId,
      userId,
    );

    // Update user's signature
    await this.prisma.user.update({
      where: { id: userId },
      data: { signatureImage: filePath },
    });

    return {
      path: filePath,
      storage: this.uploadService.isS3Enabled() ? 's3' : 'local',
    };
  }

  @Post('profile-image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload user profile image',
    description: `Uploads a user's profile/avatar image.

**Storage Path:**
- S3: \`organizations/{orgId}/users/{userId}/profile/{filename}\`
- Local: \`/uploads/profile-images/{filename}\`

**Constraints:**
- File types: JPEG, PNG, GIF, WebP
- Max size: 5MB`,
  })
  @ApiBody({
    description: 'Profile image file to upload',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, GIF, or WebP)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Profile image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path (S3 key or local path)',
          example: 'organizations/abc123/users/user456/profile/xyz789.png',
        },
        storage: {
          type: 'string',
          enum: ['s3', 'local'],
          description: 'Storage backend used',
          example: 's3',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    // Upload with organization and user context
    // S3 path: organizations/{orgId}/users/{userId}/profile/{filename}
    const filePath = await this.uploadService.uploadFile(
      file,
      'profile-images',
      organizationId,
      userId,
    );

    // Update user's profile image
    await this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: filePath },
    });

    return {
      path: filePath,
      storage: this.uploadService.isS3Enabled() ? 's3' : 'local',
    };
  }

  @Get('url')
  @ApiOperation({
    summary: 'Get file URL',
    description: `Retrieves a URL for accessing a file.

**Behavior:**
- For S3 files: Generates a pre-signed URL valid for 1 hour
- For local files: Returns the static file URL

**Usage:**
Use this endpoint to convert stored file paths (from upload responses) into accessible URLs for display.`,
  })
  @ApiQuery({
    name: 'path',
    required: true,
    description:
      'File path or S3 key (e.g., "organizations/abc123/logo/xyz789.png" or "/uploads/logos/xyz789.png")',
    example: 'organizations/abc123/logo/xyz789.png',
  })
  @ApiResponse({
    status: 200,
    description: 'File URL retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Accessible URL for the file (pre-signed for S3)',
          example:
            'https://bucket.s3.region.amazonaws.com/organizations/abc123/logo/xyz789.png?X-Amz-...',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file path' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFileUrl(@Query('path') filePath: string) {
    const url = await this.uploadService.getFileUrl(filePath);
    return { url };
  }

  @Get('status')
  @ApiOperation({
    summary: 'Check storage status',
    description: `Returns the current storage configuration status.

Use this endpoint to determine whether the system is using S3 or local storage.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Storage status retrieved',
    schema: {
      type: 'object',
      properties: {
        s3Enabled: {
          type: 'boolean',
          description: 'Whether S3 storage is enabled and configured',
          example: true,
        },
        storageType: {
          type: 'string',
          enum: ['s3', 'local'],
          description: 'Current storage backend in use',
          example: 's3',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStorageStatus() {
    return {
      s3Enabled: this.uploadService.isS3Enabled(),
      storageType: this.uploadService.isS3Enabled() ? 's3' : 'local',
    };
  }
}
