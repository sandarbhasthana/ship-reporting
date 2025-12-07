import { Module } from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { InspectionsController } from './inspections.controller';
import { EntriesService } from './entries.service';
import { EntriesController } from './entries.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InspectionsController, EntriesController],
  providers: [InspectionsService, EntriesService],
  exports: [InspectionsService, EntriesService],
})
export class InspectionsModule {}
