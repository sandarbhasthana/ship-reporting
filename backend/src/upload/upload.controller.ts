import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleName } from '@ship-reporting/prisma';
import { PrismaService } from '../prisma/prisma.service';
import 'multer';

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
@UseGuards(RolesGuard)
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('logo')
  @Roles(RoleName.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    const filePath = await this.uploadService.uploadFile(file, 'logos');

    // Update organization logo if organizationId is provided
    if (organizationId) {
      await this.prisma.organization.update({
        where: { id: organizationId },
        data: { logo: filePath },
      });
    }

    return { path: filePath };
  }

  @Post('signature')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadSignature(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    const filePath = await this.uploadService.uploadFile(file, 'signatures');

    // Update user's signature
    await this.prisma.user.update({
      where: { id: userId },
      data: { signatureImage: filePath },
    });

    return { path: filePath };
  }
}
