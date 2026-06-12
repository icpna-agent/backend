import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './core/swagger.config';
import { setupCors } from './core/cors.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  
  setupSwagger(app);
  setupCors(app);
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
