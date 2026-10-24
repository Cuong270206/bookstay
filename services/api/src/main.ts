import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const isProduction = process.env.NODE_ENV === 'production';

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Security headers
  app.use(helmet());

  // Behind reverse proxy (Render/Railway/Nginx) → lấy IP thật từ X-Forwarded-For
  app.set('trust proxy', true);
  app.enableShutdownHooks();

  // CORS: FRONTEND_URL có thể chứa nhiều origin phân cách bằng dấu phẩy
  const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
  app.enableCors({
    origin: frontendUrls,
    credentials: true,
  });

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

  // Swagger: chỉ mở ở dev, hoặc khi chủ động bật bằng SWAGGER_ENABLED=true
  if (!isProduction || process.env.SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('BookStay API')
      .setDescription('Marketplace Booking Homestay API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  } else {
    Logger.log('Swagger disabled in production (set SWAGGER_ENABLED=true to force enable)');
  }

  // Chặn khởi động khi production thiếu cấu hình bảo mật
  if (isProduction) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32 || jwtSecret.includes('change-in-production')) {
      Logger.error('JWT_SECRET phải là chuỗi ngẫu nhiên ≥ 32 ký tự và khác giá trị mặc định');
      process.exit(1);
    }
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  Logger.log(`🚀 API running on http://localhost:${port}`);
}
bootstrap();
