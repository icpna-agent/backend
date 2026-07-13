import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from '@core/swagger.core';
import { setupCors } from '@core/cors.core';
import { setupTransformer } from '@core/transformer.core';
import { config } from 'dotenv';
import { json, urlencoded } from 'express';

config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));
  
  setupSwagger(app);
  setupCors(app);
  setupTransformer(app);
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
