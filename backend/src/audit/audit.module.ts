import { Module, Global } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuditService } from './audit.service';
import { AuditController, PlatformAuditController } from './audit.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [AuditController, PlatformAuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
