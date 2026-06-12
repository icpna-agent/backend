import { INestApplication } from '@nestjs/common';

export function setupCors(app: INestApplication) {
  app.enableCors({
    origin: '*',   // it might have to be changed later...
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}
