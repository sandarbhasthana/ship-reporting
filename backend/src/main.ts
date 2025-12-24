import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  // Security headers with Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow static assets
      contentSecurityPolicy: false, // Disable CSP for API (frontend handles it)
    }),
  );

  // Enable gzip/deflate compression for responses
  app.use(compression());

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Global exception filter for consistent error responses
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Serve static files (uploads)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger setup (disabled in production for performance)
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Ship Reporting API')
      .setDescription('API for ship inspection reporting system')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
  logger.log(`🔒 Security headers enabled (Helmet)`);
  logger.log(`📦 Response compression enabled`);
  if (!isProduction) {
    logger.log(`📚 Swagger docs available at: http://localhost:${port}/docs`);
  }
}
void bootstrap();
