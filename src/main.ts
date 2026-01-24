import { ValidationPipe, HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove fields unregistered in DTO
      forbidNonWhitelisted: true, // error if there's any unknown field
      transform: true,
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
    }),
  );

  await app.listen(3000);
}
bootstrap();
