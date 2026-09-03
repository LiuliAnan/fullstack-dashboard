import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'node:path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  // 允许前端跨域请求
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // 全局启用验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Dashboard API')
    .setDescription(
      'Authentication, user management, company management, and dashboard aggregation APIs.',
    )
    .setVersion('1.0')
    .addTag('Auth', 'Registration, login, and current-user endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Companies', 'Company and relationship management endpoints')
    .addTag('Dashboard', 'Dashboard aggregation endpoints')
    .addTag(
      'AI Agent',
      'Persistent conversations, model chat, and file uploads',
    )
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    jsonDocumentUrl: 'api/docs-json',
    customSiteTitle: 'Dashboard API Docs',
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(3001);
}
bootstrap();
