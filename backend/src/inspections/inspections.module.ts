import { Module } from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { InspectionsController } from './inspections.controller';
import { EntriesService } from './entries.service';
import { EntriesController } from './entries.controller';
import { PdfService } from './pdf.service';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [PrismaModule, S3Module],
  controllers: [InspectionsController, EntriesController],
  providers: [InspectionsService, EntriesService, PdfService],
  exports: [InspectionsService, EntriesService, PdfService],
})
export class InspectionsModule {}
