import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { graphqlUploadExpress } from 'graphql-upload-ts';
import { json } from 'express';
import { HttpExceptionFilter } from './cloudinary/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    graphqlUploadExpress({ 
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxFiles: 10,
    }));

    app.use(json({limit: '50mb'}))

  app.useGlobalPipes(new ValidationPipe())
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'apollo-require-preflight' // Critical for file uploads
    ],
    credentials: true,
    maxAge: 86400,
  })
  app.use(json({ limit: '50mb' }));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
