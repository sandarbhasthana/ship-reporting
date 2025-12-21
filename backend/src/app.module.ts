import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { EmailModule } from './email/email.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { S3Module } from './s3/s3.module';
import s3Config from './s3/s3.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [s3Config],
    }),
    S3Module,
    // Rate limiting configuration
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 30, // 30 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 150, // 150 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 500, // 500 requests per minute
      },
    ]),
    PrismaModule,
    EmailModule,
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
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
