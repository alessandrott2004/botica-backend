import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Habilitar CORS para consumo web
  app.enableCors();

  // Servir archivos estáticos del frontend desde la carpeta 'public'
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Validación y transformación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 Sistema Botica Nova Salud iniciado en: http://localhost:${port}`);
}
bootstrap();
