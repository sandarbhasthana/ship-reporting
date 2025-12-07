import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationModule } from './organization/organization.module';
import { UploadModule } from './upload/upload.module';
import { UsersModule } from './users/users.module';
import { VesselsModule } from './vessels/vessels.module';
import { InspectionsModule } from './inspections/inspections.module';
import { AuditModule } from './audit/audit.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    OrganizationModule,
    UploadModule,
    UsersModule,
    VesselsModule,
    InspectionsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply JWT guard globally - use @Public() decorator to skip
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
