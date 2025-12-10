import { Module } from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { InspectionsController } from './inspections.controller';
import { EntriesService } from './entries.service';
import { EntriesController } from './entries.controller';
import { PdfService } from './pdf.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InspectionsController, EntriesController],
  providers: [InspectionsService, EntriesService, PdfService],
  exports: [InspectionsService, EntriesService, PdfService],
})
export class InspectionsModule {}
