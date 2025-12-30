import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { graphqlUploadExpress } from 'graphql-upload-ts';
import { json } from 'express';
import { HttpExceptionFilter } from './cloudinary/http-exception.filter';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Stripe webhook must be raw first
  app.use('/stripe/webhook', express.raw({ type: 'application/json' }));

  // JSON parser for all other routes
  app.use(json({ limit: '50mb' }));

  // GraphQL file uploads
  app.use(
    graphqlUploadExpress({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxFiles: 10,
    }),
  );

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'apollo-require-preflight',
    ],
    credentials: true,
    maxAge: 86400,
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
